import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { Application } from "../models/applicationSchema.js";
import { Job } from "../models/jobSchema.js";
import { v2 as cloudinary } from "cloudinary";

// Utility function to check if the user has already applied for the job
const checkIfAlreadyApplied = async (jobId, userId) => {
  return await Application.findOne({
    "jobInfo.jobId": jobId,
    "jobSeekerInfo.id": userId,
  });
};

// Utility function to upload resume to Cloudinary
const uploadResumeToCloudinary = async (resumeFile) => {
  const cloudinaryResponse = await cloudinary.uploader.upload(
    resumeFile.tempFilePath,
    {
      folder: "Job_Seekers_Resume",
    }
  );
  if (!cloudinaryResponse) {
    throw new Error("Failed to upload resume to Cloudinary.");
  }
  return {
    public_id: cloudinaryResponse.public_id,
    url: cloudinaryResponse.secure_url,
  };
};

export const postApplication = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { name, email, phone, address } = req.body;

  // Validate required fields
  if (!name || !email || !phone || !address) {
    return next(new ErrorHandler("All fields are required.", 400));
  }

  // Fetch job details
  const jobDetails = await Job.findById(id);
  if (!jobDetails) {
    return next(new ErrorHandler("Job not found.", 404));
  }

  // Check if the user has already applied
  const isAlreadyApplied = await checkIfAlreadyApplied(id, req.user._id);
  if (isAlreadyApplied) {
    return next(new ErrorHandler("You have already applied for this job.", 400));
  }

  // Prepare job seeker info
  const jobSeekerInfo = {
    id: req.user._id,
    name,
    email,
    phone,
    address,
    role: "Job Seeker",
  };

  // Handle resume upload
  if (req.files && req.files.resume) {
    try {
      const resume = await uploadResumeToCloudinary(req.files.resume);
      jobSeekerInfo.resume = resume;
    } catch (error) {
      return next(new ErrorHandler("Failed to upload resume.", 500));
    }
  } else if (!req.user?.resume?.url) {
    return next(new ErrorHandler("Please upload your resume.", 400));
  } else {
    jobSeekerInfo.resume = {
      public_id: req.user.resume.public_id,
      url: req.user.resume.url,
    };
  }

  // Prepare employer and job info
  const employerInfo = {
    id: jobDetails.postedBy,
    role: "Employer",
  };
  const jobInfo = {
    jobId: id,
    jobTitle: jobDetails.title,
  };

  // Create application
  const application = await Application.create({
    jobSeekerInfo,
    employerInfo,
    jobInfo,
  });

  res.status(201).json({
    success: true,
    message: "Application submitted successfully.",
    data: application,
  });
});

export const employerGetAllApplication = catchAsyncErrors(
  async (req, res, next) => {
    const { _id } = req.user;
    const applications = await Application.find({
      "employerInfo.id": _id,
      "deletedBy.employer": false,
    });
    res.status(200).json({
      success: true,
      message: "Applications fetched successfully.",
      data: applications,
    });
  }
);

export const jobSeekerGetAllApplication = catchAsyncErrors(
  async (req, res, next) => {
    const { _id } = req.user;
    const applications = await Application.find({
      "jobSeekerInfo.id": _id,
      "deletedBy.jobSeeker": false,
    });
    res.status(200).json({
      success: true,
      message: "Applications fetched successfully.",
      data: applications,
    });
  }
);

export const deleteApplication = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const application = await Application.findById(id);
  if (!application) {
    return next(new ErrorHandler("Application not found.", 404));
  }

  const { role } = req.user;
  switch (role) {
    case "Job Seeker":
      application.deletedBy.jobSeeker = true;
      break;
    case "Employer":
      application.deletedBy.employer = true;
      break;
    default:
      return next(new ErrorHandler("Invalid role.", 400));
  }

  await application.save();

  // Delete application if both parties have marked it as deleted
  if (application.deletedBy.employer && application.deletedBy.jobSeeker) {
    await application.deleteOne();
  }

  res.status(200).json({
    success: true,
    message: "Application deleted successfully.",
  });
});