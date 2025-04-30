import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { User } from "../models/userSchema.js";
import { v2 as cloudinary } from "cloudinary";
import { sendToken } from "../utilities/jwtToken.js";

export const register = catchAsyncErrors(async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      address,
      password,
      role,
      firstChoice,
      secondChoice,
      thirdChoice,
    } = req.body;

    if (!name || !email || !phone || !address || !password || !role) {
      return next(new ErrorHandler("All fileds are required.", 400));
    }
    if (
      role === "Job Seeker" &&
      (!firstChoice || !secondChoice || !thirdChoice)
    ) {
      return next(
        new ErrorHandler("Please provide your preferred job choices.", 400)
      );
    }
    if (role === "Job Seeker" && (!req.files || !req.files.resume)) {
      return next(new ErrorHandler("Please upload your job resume file.", 400));
    }
    if (!req.files || !req.files.profilePicture) {
      return next(new ErrorHandler("Please upload your profile picture.", 400));
    }
    const existingUser = await User.findOne({ email, role });
    if (existingUser) {
      return next(
        new ErrorHandler(
          "Email is already registered with same user role.",
          400
        )
      );
    }
    const userData = {
      name,
      email,
      phone,
      address,
      password,
      role,
      jobChoices: {
        firstChoice,
        secondChoice,
        thirdChoice,
      },
    };
    if (req.files && req.files.profilePicture) {
      const { profilePicture } = req.files;
      if (profilePicture) {
        try {
          const cloudinaryResponse = await cloudinary.uploader.upload(
            profilePicture.tempFilePath,
            { folder: "UserProfilePictures" }
          );
          if (!cloudinaryResponse || cloudinaryResponse.error) {
            return next(
              new ErrorHandler(
                "Failed to upload your profile picture to cloud.",
                500
              )
            );
          }
          userData.profilePicture = {
            public_id: cloudinaryResponse.public_id,
            url: cloudinaryResponse.secure_url,
          };
        } catch (error) {
          return next(
            new ErrorHandler("Failed to upload Profile Picture", 500)
          );
        }
      }
    }

    if (req.files && req.files.resume) {
      const { resume } = req.files;
      if (resume) {
        try {
          const cloudinaryResponse = await cloudinary.uploader.upload(
            resume.tempFilePath,
            { folder: "Job_Seekers_Resume" }
          );
          if (!cloudinaryResponse || cloudinaryResponse.error) {
            return next(
              new ErrorHandler("Failed to upload resume to cloud.", 500)
            );
          }
          userData.resume = {
            public_id: cloudinaryResponse.public_id,
            url: cloudinaryResponse.secure_url,
          };
        } catch (error) {
          return next(new ErrorHandler("Failed to upload resume", 500));
        }
      }
    }
    const user = await User.create(userData);
    sendToken(user, 201, res, "User Registered.");
  } catch (error) {
    next(error);
  }
});

export const login = catchAsyncErrors(async (req, res, next) => {
  const { role, email, password } = req.body;
  if (!email && !password && !role) {
    return next(
      new ErrorHandler(
        "User Role, Email and Password are required For login.",
        400
      )
    );
  }
  if (!role && email && password) {
    return next(new ErrorHandler("User Role is required for login.", 400));
  }
  if (role && password && !email) {
    return next(new ErrorHandler("Email is required for login.", 400));
  }
  if (role && email && !password) {
    return next(new ErrorHandler("Password is required for login.", 400));
  }
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(new ErrorHandler("Invalid email or password.", 400));
  }
  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid email or password.", 400));
  }
  if (user.role !== role) {
    return next(new ErrorHandler("Invalid user role.", 400));
  }
  sendToken(user, 200, res, "User logged in successfully.");
});

export const logout = catchAsyncErrors(async (req, res, next) => {
  res
    .status(200)
    .cookie("token", "", {
      expires: new Date(Date.now()),
      httpOnly: true,
      secure: true,
      sameSite: "None",
    })
    .json({
      success: true,
      message: "Logged out successfully.",
    });
});

export const getUser = catchAsyncErrors(async (req, res, next) => {
  const user = req.user;
  res.status(200).json({
    success: true,
    user,
  });
});

export const updateProfile = catchAsyncErrors(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    address: req.body.address,
    jobChoices: {
      firstChoice: req.body.firstChoice,
      secondChoice: req.body.secondChoice,
      thirdChoice: req.body.thirdChoice,
    },
  };
  const { firstChoice, secondChoice, thirdChoice } = newUserData.jobChoices;

  if (
    req.user.role === "Job Seeker" &&
    (!firstChoice || !secondChoice || !thirdChoice)
  ) {
    return next(
      new ErrorHandler("Please provide your all preferred job jobChoices.", 400)
    );
  }

  if (req.files) {
    const profilePicture = req.files?.profilePicture;
    const resume = req.files?.resume;

    if (profilePicture) {
      const currentProfilePictureId = req.user.profilePicture?.public_id;
      if (currentProfilePictureId) {
        try {
          await cloudinary.uploader.destroy(currentProfilePictureId);
        } catch (error) {
          console.error("Cloudinary destroy error (Profile Pic):", error);
        }
      }
      try {
        const newProfilePicture = await cloudinary.uploader.upload(
          profilePicture.tempFilePath,
          {
            folder: "UserProfilePictures",
          }
        );
        newUserData.profilePicture = {
          public_id: newProfilePicture.public_id,
          url: newProfilePicture.secure_url,
        };
      } catch (uploadError) {
        console.error("Cloudinary upload error (Profile Pic):", uploadError);
        return next(
          new ErrorHandler("Failed to upload new profile picture.", 500)
        );
      }
    }

    if (resume && req.user.role === "Job Seeker") {
      const currentResumeId = req.user.resume?.public_id;
      if (currentResumeId) {
        try {
          await cloudinary.uploader.destroy(currentResumeId);
        } catch (error) {
          console.error("Cloudinary destroy error (Resume):", error);
        }
      }
      try {
        const newResume = await cloudinary.uploader.upload(
          resume.tempFilePath,
          {
            folder: "Job_Seekers_Resume",
          }
        );
        newUserData.resume = {
          public_id: newResume.public_id,
          url: newResume.secure_url,
        };
      } catch (uploadError) {
        console.error("Cloudinary upload error (Resume):", uploadError);
        return next(new ErrorHandler("Failed to upload new resume.", 500));
      }
    }
  }

  const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });
  res.status(200).json({
    success: true,
    user,
    message: "Profile updated.",
  });
});

export const updatePassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");

  const isPasswordMatched = await user.comparePassword(req.body.oldPassword);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Old password is incorrect.", 400));
  }

  if (req.body.newPassword !== req.body.confirmPassword) {
    return next(
      new ErrorHandler("New password & confirm password do not match.", 400)
    );
  }

  user.password = req.body.newPassword;
  await user.save();
  sendToken(user, 200, res, "Password updated successfully.");
});
