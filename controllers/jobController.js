import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { Job } from "../models/jobSchema.js";
import { v2 as cloudinary } from "cloudinary";

export const postJob = catchAsyncErrors(async (req, res, next) => {
  const {
    title,
    jobType,
    location,
    companyName,
    introduction,
    responsibilities,
    qualifications,
    offers,
    salary,
    hiringMultipleCandidates,
    WebsiteTitle,
    WebsiteUrl,
    jobCategory,
  } = req.body;
  if (
    !title ||
    !jobType ||
    !location ||
    !companyName ||
    !introduction ||
    !responsibilities ||
    !qualifications ||
    !salary ||
    !jobCategory
  ) {
    return next(new ErrorHandler("Please provide full job details.", 400));
  }
  if ((WebsiteTitle && !WebsiteUrl) || (!WebsiteTitle && WebsiteUrl)) {
    return next(
      new ErrorHandler(
        "Provide both the website url and title, or leave both blank.",
        400
      )
    );
  }
  const postedBy = req.user._id;
  const jobData = {
    title,
    jobType,
    location,
    companyName,
    introduction,
    responsibilities,
    qualifications,
    offers,
    salary,
    hiringMultipleCandidates,
    Website: {
      title: WebsiteTitle,
      url: WebsiteUrl,
    },
    jobCategory,
    postedBy,
  };
  if (!req.files || !req.files.companyLogo) {
    return next(new ErrorHandler("Please upload your company's logo.", 400));
  }
  if (req.files && req.files.companyLogo) {
    const { companyLogo } = req.files;
    if (companyLogo) {
      try {
        const cloudinaryResponse = await cloudinary.uploader.upload(
          companyLogo.tempFilePath,
          { folder: "CompanyLogos" }
        );
        if (!cloudinaryResponse || cloudinaryResponse.error) {
          return next(
            new ErrorHandler(
              "Failed to upload your company's logo to cloud.",
              500
            )
          );
        }
        jobData.companyLogo = {
          public_id: cloudinaryResponse.public_id,
          url: cloudinaryResponse.secure_url,
        };
      } catch (error) {
        return next(new ErrorHandler("Failed to upload company's logo", 500));
      }
    }
  }

  const job = await Job.create(jobData);
  res.status(201).json({
    success: true,
    message: "Job posted successfully.",
    job,
  });
});

export const getAllJobs = catchAsyncErrors(async (req, res, next) => {
  const { city, jobCategory, jobType, searchKeyword } = req.query;
  const query = {};
  if (city) {
    query.location = city;
  }
  if (jobCategory) {
    query.jobCategory = { $regex: jobCategory, $options: "i" };
  }
  if (jobType) {
    query.jobType = jobType;
  }
  if (searchKeyword) {
    query.$or = [
      { title: { $regex: searchKeyword, $options: "i" } },
      { companyName: { $regex: searchKeyword, $options: "i" } },
      { location: { $regex: searchKeyword, $options: "i" } },
      { jobCategory: { $regex: searchKeyword, $options: "i" } },
    ];
  }
  const jobs = await Job.find(query);
  res.status(200).json({
    success: true,
    jobs,
    count: jobs.length,
  });
});

export const getMyJobs = catchAsyncErrors(async (req, res, next) => {
  const myJobs = await Job.find({ postedBy: req.user._id });
  res.status(200).json({
    success: true,
    myJobs,
  });
});

export const deleteJob = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const job = await Job.findById(id);
  if (!job) {
    return next(new ErrorHandler("Oops! Job not found.", 404));
  }
  if (job.companyLogo?.public_id) {
    await cloudinary.uploader.destroy(job.companyLogo.public_id);
  }
  await job.deleteOne();
  res.status(200).json({
    success: true,
    message: "Job deleted.",
  });
});

export const getASingleJob = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const job = await Job.findById(id);
  if (!job) {
    return next(new ErrorHandler("Job not found.", 404));
  }
  res.status(200).json({
    success: true,
    job,
  });
});
