"use client";

import React, { useState, useEffect, useCallback } from "react";
import Header from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import { CameraIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { API_CONFIG } from "@/lib/config";
import { 
  companyService, 
  CompanyProfile, 
  CompanyUser 
} from "@/services/company.service";

export default function CompanyProfilePage() {
  const [tab, setTab] = useState("company");
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editData, setEditData] = useState<Partial<CompanyProfile> | null>(null);
  const [invitationCode, setInvitationCode] = useState<string>("");
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });


  useEffect(() => {
    fetchCompanyProfile();
  }, []);

  const fetchCompanyProfile = useCallback(async () => {
    try {
      setLoading(true);
      const data = await companyService.getCompanyProfile();
      setCompanyProfile(data);
    } catch (error) {
      console.error("Error fetching company profile:", error);
      toast.error("Failed to load company profile");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleEditMode = useCallback(() => {
    if (isEditMode) {
      // Exiting edit mode, discard changes
      setEditData(null);
      setIsEditMode(false);
    } else {
      // Entering edit mode, initialize editData
      setEditData({ ...companyProfile });
      setIsEditMode(true);
    }
  }, [isEditMode, companyProfile]);

  const handleSaveProfile = useCallback(async () => {
    if (!companyProfile || !editData) return;

    try {
      setIsSaving(true);
      const updateInput = {
        name: editData.name,
        description: editData.description,
        industry: editData.industry,
        website: editData.website,
        email: editData.email,
        phone: editData.phone,
        founded: editData.founded,
        mission: editData.mission,
      };

      const updatedCompany = await companyService.updateCompany(companyProfile.id, updateInput);
      setCompanyProfile(updatedCompany);
      setEditData(null);
      setIsEditMode(false);
      toast.success("Company profile updated successfully!");
    } catch (error: any) {
      console.error("Error updating company profile:", error);
      toast.error(error.message || "Failed to update company profile");
    } finally {
      setIsSaving(false);
    }
  }, [companyProfile, editData]);

  const handleCancelEdit = useCallback(() => {
    setEditData(null);
    setIsEditMode(false);
  }, []);

  const generateInvitationCode = useCallback(async () => {
    try {
      setGeneratingInvite(true);
      const data = await companyService.generateInvitationCode();
      setInvitationCode(data.code);
      toast.success("Invitation code generated successfully!");
    } catch (error: any) {
      console.error("Error generating invitation code:", error);
      toast.error(error.message || "Failed to generate invitation code");
    } finally {
      setGeneratingInvite(false);
    }
  }, []);

  const copyInvitationLink = useCallback(async () => {
    if (!invitationCode) return;
    
    try {
      const inviteLink = `${window.location.origin}/join?code=${invitationCode}`;
      await navigator.clipboard.writeText(inviteLink);
      toast.success("Invitation link copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      toast.error("Failed to copy link. Please try again.");
    }
  }, [invitationCode]);

  const handleLogoUpload = useCallback(async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Please upload an image smaller than 5MB");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");

      // Convert file to base64
      const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
            const result = reader.result as string;
            // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
            const base64 = result.split(',')[1];
            resolve(base64);
          };
          reader.onerror = error => reject(error);
        });
      };

      const base64File = await fileToBase64(file);

      // Upload file to S3 using GraphQL mutation with base64
      const uploadResponse = await fetch(`${API_CONFIG.API_BASE_URL}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: `
            mutation UploadCVToS3($base64File: String!, $filename: String!, $mimetype: String!) {
              uploadCVToS3(base64File: $base64File, filename: $filename, mimetype: $mimetype) {
                url
                key
              }
            }
          `,
          variables: {
            base64File,
            filename: file.name,
            mimetype: file.type
          }
        }),
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload logo");
      }

      const uploadResult = await uploadResponse.json();
      const logoUrl = uploadResult.data?.uploadCVToS3?.url;

      if (logoUrl) {
        // Get company ID from profile
        const companyId = companyProfile?.id;
        
        if (!companyId) {
          throw new Error("Company ID not found");
        }

        // Update company profile with new logo URL in database
        const updateCompanyResponse = await fetch(`${API_CONFIG.API_BASE_URL}/graphql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            query: `
              mutation UpdateCompany($id: ID!, $input: UpdateCompanyInput!) {
                updateCompany(id: $id, input: $input) {
                  id
                  logo
                }
              }
            `,
            variables: {
              id: companyId,
              input: {
                logo: logoUrl
              }
            }
          }),
        });

        if (!updateCompanyResponse.ok) {
          throw new Error("Failed to update company profile");
        }

        const updateCompanyResult = await updateCompanyResponse.json();
        
        if (updateCompanyResult.errors) {
          throw new Error(updateCompanyResult.errors[0].message);
        }

        // Update local state
        setCompanyProfile((prev) =>
          prev ? { ...prev, logo: logoUrl } : null
        );
        toast.success("Company logo updated successfully!");
      } else {
        throw new Error("Failed to get logo URL");
      }
    } catch (error: any) {
      console.error("Error uploading logo:", error);
      toast.error(error.message || "Failed to upload logo");
    } finally {
      setLoading(false);
    }
  }, [companyProfile]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading company profile...</p>
        </div>
      </div>
    );
  }

  if (!companyProfile) {
    return (
      <div className="min-h-screen  flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No company profile found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen ">
      <Header
        title="Company Profile"
        subtitle="Manage your company, users, and subscription."
      />
      <main className="pt-20 px-2 sm:px-3 w-full">
        {/* Hero Section */}
        <div className="bg-white rounded-sm shadow-sm p-4 sm:p-6 mb-4 sm:mb-6 border border-gray-100">
          <div className="flex flex-col lg:flex-row items-center gap-4 sm:gap-6">
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="w-20 h-20 bg-primary-600 rounded-sm flex items-center justify-center text-2xl font-bold text-white shadow-lg overflow-hidden">
                  {companyProfile.logo ? (
                    <img
                      src={
                        companyProfile.logo.startsWith('http') 
                          ? companyProfile.logo 
                          : `/api/proxy-image?url=${encodeURIComponent(
                              `${API_CONFIG.UPLOADS_URL}/${companyProfile.logo}`
                            )}`
                      }
                      alt="Company Logo"
                      className="w-full h-full object-cover rounded-sm"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-white">
                      {companyProfile.name?.charAt(0) || "C"}
                    </span>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 w-7 h-7 bg-white rounded-full shadow-lg cursor-pointer flex items-center justify-center hover:bg-gray-50 transition-colors border-2 border-white">
                  <CameraIcon className="w-3.5 h-3.5 text-gray-600" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    disabled={loading}
                  />
                </label>
              </div>
            </div>
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                {companyProfile.name || "Company Name"}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mb-3">
                {companyProfile.description ||
                  "Company description will appear here"}
              </p>
              <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                {companyProfile.industry && (
                  <span className="px-3 py-1 bg-primary-600/10 text-primary-600 rounded-sm text-xs sm:text-sm font-semibold border border-primary-600/20">
                    {companyProfile.industry}
                  </span>
                )}
                {companyProfile.headquarters && (
                  <span className="px-3 py-1 bg-primary-600/10 text-primary-600 rounded-sm text-xs sm:text-sm font-semibold border border-primary-600/20">
                    {companyProfile.headquarters}
                  </span>
                )}
                {companyProfile.employees && (
                  <span className="px-3 py-1 bg-primary-600/10 text-primary-600 rounded-sm text-xs sm:text-sm font-semibold border border-primary-600/20">
                    {companyProfile.employees} employees
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {companyProfile.stats && companyProfile.stats.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
            {companyProfile.stats.map((stat, i) => (
              <div
                key={i}
                className="bg-white rounded-sm p-3 sm:p-4 shadow-sm border border-gray-100 text-center"
              >
                <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm text-gray-500 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-white rounded-sm shadow-sm border border-gray-100 mb-4 sm:mb-6">
          <div className="flex gap-1 p-1.5 sm:p-2 items-center justify-between overflow-x-auto">
            <div className="flex gap-1 flex-1 min-w-0">
              <button
                className={`px-3 sm:px-4 py-2 rounded-sm font-semibold text-xs sm:text-sm transition-all duration-200 whitespace-nowrap ${
                  tab === "company"
                    ? "bg-primary-600 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
                onClick={() => setTab("company")}
              >
                Company
              </button>
              <button
                className={`px-3 sm:px-4 py-2 rounded-sm font-semibold text-xs sm:text-sm transition-all duration-200 whitespace-nowrap ${
                  tab === "users"
                    ? "bg-primary-600 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
                onClick={() => setTab("users")}
              >
                Team
              </button>
              <button
                className={`px-3 sm:px-4 py-2 rounded-sm font-semibold text-xs sm:text-sm transition-all duration-200 whitespace-nowrap ${
                  tab === "subscription"
                    ? "bg-primary-600 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
                onClick={() => setTab("subscription")}
              >
                Billing
              </button>
              <button
                className={`px-3 sm:px-4 py-2 rounded-sm font-semibold text-xs sm:text-sm transition-all duration-200 whitespace-nowrap ${
                  tab === "security"
                    ? "bg-primary-600 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
                onClick={() => setTab("security")}
              >
                Security
              </button>
            </div>
            {tab === "company" && (
              <div className="flex gap-1.5 ml-2 flex-shrink-0">
                {!isEditMode ? (
                  <Button
                    onClick={handleEditMode}
                    className="bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm px-2.5 sm:px-4 py-1.5 sm:py-2 h-auto"
                    size="sm"
                  >
                    Edit
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm px-2.5 sm:px-4 py-1.5 sm:py-2 h-auto"
                      size="sm"
                    >
                      {isSaving ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      onClick={handleCancelEdit}
                      variant="secondary"
                      size="sm"
                      className="text-xs sm:text-sm px-2.5 sm:px-4 py-1.5 sm:py-2 h-auto"
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-sm shadow-sm p-4 sm:p-6 border border-gray-100">
          {/* Tab Content */}
          {tab === "company" && (
            <div className="space-y-6">
              {/* Company Logo Section */}
              <div className="bg-gray-50 rounded-sm p-4 sm:p-5">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3">
                  Company Logo
                </h3>
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="relative flex-shrink-0">
                    <div className="w-16 h-16 bg-primary-600 rounded-sm flex items-center justify-center text-xl font-bold text-white shadow-sm overflow-hidden">
                      {companyProfile.logo ? (
                        <img
                          src={
                            companyProfile.logo.startsWith('http') 
                              ? companyProfile.logo 
                              : `/api/proxy-image?url=${encodeURIComponent(
                                  `${API_CONFIG.UPLOADS_URL}/${companyProfile.logo}`
                                )}`
                          }
                          alt="Company Logo"
                          className="w-full h-full object-cover rounded-sm"
                        />
                      ) : (
                        <span className="text-xl font-bold text-white">
                          {companyProfile.name?.charAt(0) || "C"}
                        </span>
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 w-5 h-5 bg-white rounded-full shadow cursor-pointer flex items-center justify-center hover:bg-gray-50 transition-colors border border-gray-200">
                      <CameraIcon className="w-2.5 h-2.5 text-gray-600" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        disabled={loading}
                      />
                    </label>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-1">
                      Update Logo
                    </h4>
                    <p className="text-xs text-gray-500 mb-2">
                      Square image recommended. Max 5MB.
                    </p>
                    <label className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors">
                      <CameraIcon className="w-3 h-3 mr-1.5" />
                      Choose
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        disabled={loading}
                      />
                    </label>
                    {loading && (
                      <div className="mt-2 flex items-center text-sm text-blue-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        Uploading...
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Contact Information */}
                <div className="space-y-4 sm:space-y-5">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">
                    Contact Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                        Email
                      </label>
                      <input
                        type="email"
                        value={isEditMode && editData ? editData.email || "" : (companyProfile.email || "")}
                        onChange={(e) => isEditMode && setEditData(prev => prev ? { ...prev, email: e.target.value } : null)}
                        disabled={!isEditMode}
                        className={`w-full px-3 py-2 border border-gray-200 rounded-sm text-gray-900 font-medium text-xs sm:text-sm ${
                          isEditMode
                            ? "bg-white focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                            : "bg-gray-50/50 focus:outline-none"
                        }`}
                        placeholder="No email provided"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={isEditMode && editData ? editData.phone || "" : (companyProfile.phone || "")}
                        onChange={(e) => isEditMode && setEditData(prev => prev ? { ...prev, phone: e.target.value } : null)}
                        disabled={!isEditMode}
                        className={`w-full px-3 py-2 border border-gray-200 rounded-sm text-gray-900 font-medium text-xs sm:text-sm ${
                          isEditMode
                            ? "bg-white focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                            : "bg-gray-50/50 focus:outline-none"
                        }`}
                        placeholder="No phone provided"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                        Website
                      </label>
                      <input
                        type="url"
                        value={isEditMode && editData ? editData.website || "" : (companyProfile.website || "")}
                        onChange={(e) => isEditMode && setEditData(prev => prev ? { ...prev, website: e.target.value } : null)}
                        disabled={!isEditMode}
                        className={`w-full px-3 py-2 border border-gray-200 rounded-sm text-gray-900 font-medium text-xs sm:text-sm ${
                          isEditMode
                            ? "bg-white focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                            : "bg-gray-50/50 focus:outline-none"
                        }`}
                        placeholder="No website provided"
                      />
                    </div>
                  </div>
                </div>

                {/* Company Details */}
                <div className="space-y-4 sm:space-y-5">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">
                    Company Details
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                        Founded
                      </label>
                      <input
                        type="text"
                        value={isEditMode && editData ? editData.founded || "" : (companyProfile.founded || "")}
                        onChange={(e) => isEditMode && setEditData(prev => prev ? { ...prev, founded: e.target.value } : null)}
                        disabled={!isEditMode}
                        className={`w-full px-3 py-2 border border-gray-200 rounded-sm text-gray-900 font-medium text-xs sm:text-sm ${
                          isEditMode
                            ? "bg-white focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                            : "bg-gray-50/50 focus:outline-none"
                        }`}
                        placeholder="No founding date provided"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                        Mission
                      </label>
                      <textarea
                        value={isEditMode && editData ? editData.mission || "" : (companyProfile.mission || "")}
                        onChange={(e) => isEditMode && setEditData(prev => prev ? { ...prev, mission: e.target.value } : null)}
                        disabled={!isEditMode}
                        rows={3}
                        className={`w-full px-3 py-2 border border-gray-200 rounded-sm text-gray-900 font-medium resize-none text-xs sm:text-sm ${
                          isEditMode
                            ? "bg-white focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                            : "bg-gray-50/50 focus:outline-none"
                        }`}
                        placeholder="No mission statement provided"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Description and Industry Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                    Company Description
                  </label>
                  <textarea
                    value={isEditMode && editData ? editData.description || "" : (companyProfile.description || "")}
                    onChange={(e) => isEditMode && setEditData(prev => prev ? { ...prev, description: e.target.value } : null)}
                    disabled={!isEditMode}
                    rows={4}
                    className={`w-full px-3 py-2 border border-gray-200 rounded-sm text-gray-900 font-medium resize-none text-xs sm:text-sm ${
                      isEditMode
                        ? "bg-white focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                        : "bg-gray-50/50 focus:outline-none"
                    }`}
                    placeholder="No company description provided"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                    Industry
                  </label>
                  <input
                    type="text"
                    value={isEditMode && editData ? editData.industry || "" : (companyProfile.industry || "")}
                    onChange={(e) => isEditMode && setEditData(prev => prev ? { ...prev, industry: e.target.value } : null)}
                    disabled={!isEditMode}
                    className={`w-full px-3 py-2 border border-gray-200 rounded-sm text-gray-900 font-medium text-xs sm:text-sm ${
                      isEditMode
                        ? "bg-white focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                        : "bg-gray-50/50 focus:outline-none"
                    }`}
                    placeholder="No industry provided"
                  />
                </div>
              </div>

              {/* Company Values */}
              {companyProfile.values && companyProfile.values.length > 0 && (
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3">
                    Our Values
                  </h3>
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    {companyProfile.values.map((value, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-primary-600/10 text-primary-600 rounded-sm text-xs sm:text-sm font-semibold border border-primary-600/20"
                      >
                        {value}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Employee Benefits */}
              {companyProfile.benefits &&
                companyProfile.benefits.length > 0 && (
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3">
                      Employee Benefits
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                      {companyProfile.benefits.map((benefit, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 p-2.5 sm:p-3 bg-white/60 rounded-sm border border-gray-100"
                        >
                          <div className="w-2 h-2 bg-primary-600 rounded-full flex-shrink-0"></div>
                          <span className="text-gray-800 font-medium text-xs sm:text-sm">
                            {benefit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}

          {tab === "users" && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base sm:text-lg font-bold text-gray-900">
                  Team Members
                </h3>
                <Button
                  variant="default"
                  size="sm"
                  onClick={generateInvitationCode}
                  disabled={generatingInvite}
                  className="text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2"
                >
                  {generatingInvite ? "Generating..." : "Generate Invite Link"}
                </Button>
              </div>

              {invitationCode && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-sm p-3 sm:p-4 mb-4 sm:mb-6">
                  <h4 className="text-sm sm:text-base font-bold text-green-800 mb-2">
                    Invitation Link Generated!
                  </h4>
                  <div className="flex items-center gap-2 p-2 sm:p-2.5 bg-white rounded-sm border border-green-200">
                    <code className="flex-1 text-xs sm:text-sm text-gray-700 break-all">
                      {window.location.origin}/join?code={invitationCode}
                    </code>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={copyInvitationLink}
                      className="text-xs sm:text-sm px-2 sm:px-3 py-1 flex-shrink-0"
                    >
                      Copy
                    </Button>
                  </div>
                  <p className="text-xs sm:text-sm text-green-700 mt-2">
                    Share this link with new team members to join your company.
                  </p>
                </div>
              )}
              {companyProfile.users && companyProfile.users.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                  {companyProfile.users.map((user) => (
                    <div
                      key={user.id}
                      className="bg-white/60 rounded-sm p-3 sm:p-4 shadow-sm border border-gray-100"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-12 h-12 rounded-full object-cover border border-gray-200 shadow-sm"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-lg border border-gray-200 shadow-sm">
                            {user.name.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 text-xs sm:text-sm truncate">
                            {user.name}
                          </h4>
                          <p className="text-xs text-gray-600 truncate">{user.email}</p>
                        </div>
                      </div>
                      <div className="text-center">
                        <span className="inline-block px-2 sm:px-3 py-1 bg-primary-600 text-white rounded-sm text-xs font-semibold shadow-sm">
                          {user.role}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <div className="w-12 h-12 bg-gray-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 mb-3">No team members yet</p>
                  <p className="text-xs text-gray-400">
                    Generate an invitation link to add your first team member
                  </p>
                </div>
              )}
            </div>
          )}

          {tab === "subscription" && (
            <div className="space-y-4 sm:space-y-6">
              <div className="text-center">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">
                  Current Subscription
                </h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  Manage your subscription plan and features
                </p>
              </div>

              <div className="max-w-2xl mx-auto w-full">
                {companyProfile.subscription ? (
                  <div className="bg-primary-600 rounded-sm p-4 sm:p-6 text-white text-center shadow-sm">
                    <div className="text-xl sm:text-2xl font-bold mb-1">
                      {companyProfile.subscription.plan} Plan
                    </div>
                    <div className="text-xs sm:text-sm opacity-90 mb-3">
                      Active until {companyProfile.subscription.renewal}
                    </div>
                    <div className="inline-block px-2.5 sm:px-3 py-1 bg-white/20 rounded-sm text-xs font-semibold">
                      {companyProfile.subscription.status}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-100 rounded-sm p-4 sm:p-6 text-center">
                    <p className="text-xs sm:text-sm text-gray-600">
                      No subscription information available
                    </p>
                  </div>
                )}
              </div>

              <div className="max-w-2xl mx-auto w-full">
                <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-3">
                  Plan Features
                </h4>
                {companyProfile.subscription?.features &&
                companyProfile.subscription.features.length > 0 ? (
                  <div className="space-y-2">
                    {companyProfile.subscription.features.map((feature, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 p-2.5 sm:p-3 bg-white/60 rounded-sm border border-gray-100"
                      >
                        <div className="w-4 h-4 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg
                            className="w-2.5 h-2.5 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <span className="text-gray-800 font-medium text-xs sm:text-sm">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm text-gray-500 text-center">
                    No features listed
                  </p>
                )}
              </div>

              <div className="text-center">
                <Button variant="default" size="sm" className="text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2">
                  Upgrade Plan
                </Button>
              </div>
            </div>
          )}

      

          {tab === "security" && (
            <div className="space-y-4 sm:space-y-6">
              <div className="text-center">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">
                  Security Settings
                </h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  Update your password and security preferences
                </p>
              </div>

              <div className="max-w-2xl mx-auto w-full">
                <div className="bg-white/60 rounded-sm p-4 sm:p-6 shadow-sm border border-gray-100">
                  <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-4 sm:mb-6">
                    Change Password
                  </h4>

                  <form
                    className="space-y-3 sm:space-y-4"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (
                        passwordData.newPassword !==
                        passwordData.confirmPassword
                      ) {
                        toast.error("New passwords do not match");
                        return;
                      }
                      if (passwordData.newPassword.length < 8) {
                        toast.error("Password must be at least 8 characters long");
                        return;
                      }
                      
                      try {
                        await companyService.changePassword(
                          passwordData.currentPassword,
                          passwordData.newPassword
                        );
                        toast.success("Password changed successfully!");
                        setPasswordData({
                          currentPassword: "",
                          newPassword: "",
                          confirmPassword: "",
                        });
                      } catch (error: any) {
                        toast.error(error.message || "Failed to change password");
                      }
                    }}
                  >
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.current ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              currentPassword: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent text-xs sm:text-sm"
                          placeholder="Enter your current password"
                          required
                        />
                        <button
                          type="button"
                          className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 flex-shrink-0"
                          onClick={() =>
                            setShowPasswords({
                              ...showPasswords,
                              current: !showPasswords.current,
                            })
                          }
                        >
                          {showPasswords.current ? (
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.new ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              newPassword: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent text-xs sm:text-sm"
                          placeholder="Enter new password"
                          minLength={8}
                          required
                        />
                        <button
                          type="button"
                          className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 flex-shrink-0"
                          onClick={() =>
                            setShowPasswords({
                              ...showPasswords,
                              new: !showPasswords.new,
                            })
                          }
                        >
                          {showPasswords.new ? (
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Password must be at least 8 characters long
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.confirm ? "text" : "password"}
                          value={passwordData.confirmPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              confirmPassword: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent text-xs sm:text-sm"
                          placeholder="Confirm new password"
                          required
                        />
                        <button
                          type="button"
                          className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 flex-shrink-0"
                          onClick={() =>
                            setShowPasswords({
                              ...showPasswords,
                              confirm: !showPasswords.confirm,
                            })
                          }
                        >
                          {showPasswords.confirm ? (
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                      {passwordData.confirmPassword &&
                        passwordData.newPassword !==
                          passwordData.confirmPassword && (
                          <p className="text-xs text-red-500 mt-1">
                            Passwords do not match
                          </p>
                        )}
                    </div>

                    <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4">
                      <Button
                        type="submit"
                        variant="default"
                        size="sm"
                        className="flex-1 text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2"
                      >
                        Update Password
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2"
                        onClick={() => {
                          setPasswordData({
                            currentPassword: "",
                            newPassword: "",
                            confirmPassword: "",
                          });
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

