"use client";

import React, { useState, useEffect } from "react";
import {
  UserIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  DocumentArrowUpIcon,
  KeyIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/hooks/useAuth";
import { getProfile } from "@/services/profile";
import { getCVs, uploadCV, activateCV, deleteCV } from "@/services/cv";
import { apolloClient } from "@/lib/apollo";
import { gql } from "@apollo/client";
import toast from "react-hot-toast";

interface Tab {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
}

const TABS: Tab[] = [
  { id: "personal", label: "Personal", icon: UserIcon },
  { id: "professional", label: "Professional", icon: BriefcaseIcon },
  { id: "education", label: "Education", icon: AcademicCapIcon },
  { id: "documents", label: "Documents", icon: DocumentArrowUpIcon },
  { id: "security", label: "Security", icon: KeyIcon },
];

export default function ProfilePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("personal");
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [cvs, setCvs] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Editable profile state
  const [editedProfile, setEditedProfile] = useState<any>(null);

  // Password change state
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
  const [changingPassword, setChangingPassword] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [activatingCV, setActivatingCV] = useState<string | null>(null);
  const [deletingCV, setDeletingCV] = useState<string | null>(null);

  // Load profile data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [profileData, cvsData] = await Promise.all([
          getProfile(),
          getCVs().catch(() => []),
        ]);

        setProfile(profileData);
        setEditedProfile(profileData); // Initialize edited profile
        setCvs(cvsData || []);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load profile";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Handle password change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    try {
      setChangingPassword(true);
      const { data } = await apolloClient.mutate<{ changePassword: boolean }>({
        mutation: gql`
          mutation ChangePassword($input: ChangePasswordInput!) {
            changePassword(input: $input)
          }
        `,
        variables: {
          input: {
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword,
          },
        },
      });

      if (data?.changePassword) {
        toast.success("Password changed successfully!");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  // Handle save profile changes
  const handleSaveProfile = async () => {
    if (!editedProfile) return;
    
    try {
      setIsSaving(true);
      toast.loading("Saving changes...");
      
      // Update profile via GraphQL mutation
      const { data } = await apolloClient.mutate<{ updateProfile: boolean }>({
        mutation: gql`
          mutation UpdateProfile($input: UpdateProfileInput!) {
            updateProfile(input: $input)
          }
        `,
        variables: {
          input: {
            name: editedProfile.name,
            email: editedProfile.email,
            phone: editedProfile.phone,
            location: editedProfile.location,
            bio: editedProfile.bio,
            experience: editedProfile.experience,
            education: editedProfile.education,
          },
        },
      });

      if (data?.updateProfile) {
        setProfile(editedProfile);
        toast.dismiss();
        toast.success("Profile updated successfully!");
      }
    } catch (err: any) {
      toast.dismiss();
      toast.error(err.message || "Failed to update profile");
      console.error("Profile update error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle input change
  const handleProfileChange = (field: string, value: string) => {
    setEditedProfile((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle CV upload
  const handleCVUpload = async (file: File) => {
    console.log('[handleCVUpload] Starting with file:', file.name, file.type, file.size);
    try {
      toast.loading("Uploading CV...");
      console.log('[CV Upload] Starting upload for:', file.name);
      
      // Pass candidateId so backend automatically saves the CV
      const uploadUrl = await uploadCV(file, profile?.id);
      console.log('[CV Upload] Success, URL:', uploadUrl);
      
      toast.dismiss();
      toast.success("CV uploaded successfully!");
      
      // Wait for backend to process and create CV record
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Reload CVs
      try {
        console.log('[CV Upload] Fetching CVs from backend...');
        const cvsData = await getCVs();
        console.log('[CV Upload] Reloaded CVs:', cvsData, 'Count:', cvsData?.length || 0);
        setCvs(cvsData || []);
        
        // Also refresh profile data to get updated resumeUrl
        const updatedProfile = await getProfile();
        console.log('[CV Upload] Updated profile resumeUrl:', updatedProfile?.resumeUrl);
        setProfile(updatedProfile);
      } catch (cvsError) {
        console.error('[CV Upload] Error reloading CVs:', cvsError);
        toast.error("CV uploaded but failed to reload list. Try refreshing.");
      }
    } catch (err) {
      toast.dismiss();
      const errorMsg = err instanceof Error ? err.message : "Failed to upload CV";
      console.error('[CV Upload] Error:', errorMsg, err);
      toast.error(errorMsg);
    }
  };

  // Handle activate CV
  const handleActivateCV = async (cvId: string) => {
    try {
      setActivatingCV(cvId);
      toast.loading("Activating CV...");
      
      await activateCV(cvId);
      
      toast.dismiss();
      toast.success("CV activated!");
      
      // Reload CVs
      const cvsData = await getCVs();
      setCvs(cvsData || []);
    } catch (err) {
      toast.dismiss();
      const errorMsg = err instanceof Error ? err.message : "Failed to activate CV";
      console.error('[Activate CV] Error:', errorMsg);
      toast.error(errorMsg);
    } finally {
      setActivatingCV(null);
    }
  };

  // Handle delete CV
  const handleDeleteCV = async (cvId: string) => {
    if (!confirm('Are you sure you want to delete this CV?')) return;
    
    try {
      setDeletingCV(cvId);
      toast.loading("Deleting CV...");
      
      await deleteCV(cvId);
      
      toast.dismiss();
      toast.success("CV deleted!");
      
      // Reload CVs
      const cvsData = await getCVs();
      setCvs(cvsData || []);
    } catch (err) {
      toast.dismiss();
      const errorMsg = err instanceof Error ? err.message : "Failed to delete CV";
      console.error('[Delete CV] Error:', errorMsg);
      toast.error(errorMsg);
    } finally {
      setDeletingCV(null);
    }
  };
  // Handle drag events for CV upload
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type === 'application/pdf' || file.type === 'application/msword' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
      handleCVUpload(file);
    } else {
      toast.error("Please upload a PDF or Word document");
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-red-900">Error Loading Profile</h3>
                <p className="text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-1 lg:mb-2">My Profile</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage your personal and professional information</p>
        </div>

        {/* Tab Navigation - Scrollable on mobile, responsive on desktop */}
        <div className="mb-6 lg:mb-8">
          <div className="flex overflow-x-auto gap-2 pb-3 lg:pb-4 -mx-4 sm:mx-0 px-4 sm:px-0 scrollbar-hide">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg whitespace-nowrap text-sm sm:text-base font-medium transition-all flex-shrink-0 ${
                    isActive
                      ? "bg-primary-600 text-white shadow-md"
                      : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                  }`}
                >
                  <Icon className="w-4 sm:w-5 h-4 sm:h-5" />
                  <span className="hidden xs:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
          <style>{`
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
            .scrollbar-hide {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}</style>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg lg:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-8">
          {/* Personal Info Tab */}
          {activeTab === "personal" && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Personal Information</h2>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400 text-sm sm:text-base font-medium transition-colors"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editedProfile?.name || ""}
                    onChange={(e) => handleProfileChange("name", e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editedProfile?.email || user?.email || ""}
                    onChange={(e) => handleProfileChange("email", e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={editedProfile?.phone || ""}
                    onChange={(e) => handleProfileChange("phone", e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={editedProfile?.location || ""}
                    onChange={(e) => handleProfileChange("location", e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  value={editedProfile?.bio || ""}
                  onChange={(e) => handleProfileChange("bio", e.target.value)}
                  rows={5}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Professional Info Tab */}
          {activeTab === "professional" && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Professional Information</h2>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400 text-sm sm:text-base font-medium transition-colors"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Experience
                </label>
                <textarea
                  value={editedProfile?.experience || ""}
                  onChange={(e) => handleProfileChange("experience", e.target.value)}
                  rows={4}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Skills
                </label>
                <div className="flex flex-wrap gap-2">
                  {profile?.skills && profile.skills.length > 0 ? (
                    profile.skills.map((skill: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs sm:text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No skills added yet</p>
                  )}
                </div>
              </div>

              {profile?.workExperiences && profile.workExperiences.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-base sm:text-lg">Work Experience</h3>
                  <div className="space-y-3 sm:space-y-4">
                    {profile.workExperiences.map((exp: any, idx: number) => (
                      <div key={idx} className="p-3 sm:p-4 border border-gray-200 rounded-lg">
                        <h4 className="font-medium text-gray-900 text-sm sm:text-base">{exp.position}</h4>
                        <p className="text-sm text-gray-600">{exp.company}</p>
                        {exp.startDate && (
                          <p className="text-xs text-gray-500 mt-1">
                            {exp.startDate}
                            {exp.endDate ? ` - ${exp.endDate}` : " - Present"}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Education Tab */}
          {activeTab === "education" && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Education</h2>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400 text-sm sm:text-base font-medium transition-colors"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Education
                </label>
                <textarea
                  value={editedProfile?.education || ""}
                  onChange={(e) => handleProfileChange("education", e.target.value)}
                  rows={4}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                />
              </div>

              {profile?.educations && profile.educations.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-base sm:text-lg">Education Details</h3>
                  <div className="space-y-3 sm:space-y-4">
                    {profile.educations.map((edu: any, idx: number) => (
                      <div key={idx} className="p-3 sm:p-4 border border-gray-200 rounded-lg">
                        <h4 className="font-medium text-gray-900 text-sm sm:text-base">{edu.degree}</h4>
                        <p className="text-sm text-gray-600">{edu.institution}</p>
                        {edu.fieldOfStudy && (
                          <p className="text-sm text-gray-600">{edu.fieldOfStudy}</p>
                        )}
                        {edu.startDate && (
                          <p className="text-xs text-gray-500 mt-1">
                            {edu.startDate}
                            {edu.endDate ? ` - ${edu.endDate}` : ""}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === "documents" && (
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Your Documents</h2>
              
              <div 
                className={`border-2 border-dashed rounded-lg p-6 sm:p-8 text-center transition-colors ${
                  dragActive 
                    ? "border-primary-400 bg-primary-50" 
                    : "border-gray-300 hover:border-primary-400"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <DocumentArrowUpIcon className="w-10 sm:w-12 h-10 sm:h-12 text-gray-400 mx-auto mb-2 sm:mb-3" />
                <p className="text-gray-600 mb-1 sm:mb-2 text-sm sm:text-base">Drop your CV here or click to upload</p>
                <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">Supported formats: PDF, DOC, DOCX</p>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleCVUpload(file);
                    }
                  }}
                  className="hidden"
                  id="cv-upload"
                />
                <label
                  htmlFor="cv-upload"
                  className="inline-block px-3 sm:px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 cursor-pointer font-medium text-sm sm:text-base"
                >
                  Choose File
                </label>
              </div>

              {cvs.length > 0 && (
                <div className="space-y-2 sm:space-y-3">
                  <h3 className="font-semibold text-gray-900 text-base sm:text-lg">Your CVs</h3>
                  {cvs.map((cv: any) => (
                    <div key={cv.id} className="p-3 sm:p-4 border border-gray-200 rounded-lg">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{cv.fileName || cv.filename}</p>
                          <p className="text-xs sm:text-sm text-gray-500">
                            Uploaded {new Date(cv.uploadedAt || cv.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        {cv.isPrimary && (
                          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full w-fit">
                            Primary
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 mt-2 sm:mt-3">
                        {!cv.isPrimary && (
                          <button
                            onClick={() => handleActivateCV(cv.id)}
                            disabled={activatingCV === cv.id}
                            className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white text-xs sm:text-sm rounded-lg font-medium transition-colors"
                          >
                            {activatingCV === cv.id ? 'Activating...' : 'Activate'}
                          </button>
                        )}
                        <a
                          href={cv.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm rounded-lg font-medium transition-colors text-center"
                        >
                          Download
                        </a>
                        <button
                          onClick={() => handleDeleteCV(cv.id)}
                          disabled={deletingCV === cv.id}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white text-xs sm:text-sm rounded-lg font-medium transition-colors"
                        >
                          {deletingCV === cv.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Security Settings</h2>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                <p className="text-blue-800 text-xs sm:text-sm">
                  Keep your account secure by using a strong password
                </p>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-3 sm:space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                      className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPasswords({
                          ...showPasswords,
                          current: !showPasswords.current,
                        })
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs sm:text-sm"
                    >
                      {showPasswords.current ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                      className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPasswords({
                          ...showPasswords,
                          new: !showPasswords.new,
                        })
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs sm:text-sm"
                    >
                      {showPasswords.new ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
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
                      className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPasswords({
                          ...showPasswords,
                          confirm: !showPasswords.confirm,
                        })
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs sm:text-sm"
                    >
                      {showPasswords.confirm ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={changingPassword}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400 transition-colors font-medium"
                >
                  {changingPassword ? "Updating..." : "Update Password"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
