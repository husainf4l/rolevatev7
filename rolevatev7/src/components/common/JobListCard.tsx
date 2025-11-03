import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export interface JobData {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  type?: string;
  description?: string;
  postedAt?: string;
  deadline?: string;
  slug?: string;
}

interface JobListCardProps {
  job: JobData;
  onApply?: (jobId: string, jobSlug?: string) => void;
  onSave?: (jobId: string) => void;
  isSaved?: boolean;
  showSaveButton?: boolean;
  showApplyButton?: boolean;
}

const JobListCard: React.FC<JobListCardProps> = ({
  job,
  onApply,
  onSave,
  isSaved = false,
  showSaveButton = true,
  showApplyButton = true
}) => {
  return (
    <Card className="mb-4">
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {job.title}
            </h3>
            <p className="text-gray-600 mb-2">{job.company}</p>
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
              <span>{job.location}</span>
              {job.salary && <span>{job.salary}</span>}
              {job.type && <span>{job.type}</span>}
            </div>
            {job.description && (
              <p className="text-gray-700 text-sm line-clamp-2 mb-3">
                {job.description}
              </p>
            )}
            <div className="flex items-center gap-4 text-xs text-gray-500">
              {job.postedAt && <span>Posted {job.postedAt}</span>}
              {job.deadline && <span>Deadline: {job.deadline}</span>}
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            {showSaveButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSave?.(job.id)}
                className={`flex-1 md:flex-none ${isSaved ? 'bg-blue-50 border-blue-200' : ''}`}
              >
                {isSaved ? 'Saved' : 'Save'}
              </Button>
            )}
            {showApplyButton && (
              <Button
                size="sm"
                onClick={() => onApply?.(job.id, job.slug)}
                className="flex-1 md:flex-none"
              >
                Apply
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default JobListCard;
