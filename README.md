# KAAMSETU Backend

This repository contains the backend program for KAAMSETU which is a job portal platform developed in MERN stack.

## Note

-Config file is not given here to protect the privacy. You can create your own file which contains your own details.

## Features

- **Authentication:** Details of user is protected specially his/her password is encrypt with bycript library.

- **Role Based User Authentication:** User can login or register him/her-self as Employer or Job Seeker.

- **Profile Management:** An user can manage his/her account and perform actions like updating profile details, updating password, logout him/her-self from a browser.

- **For Employer:** An Employer can post a new job, view & delete his/her posted jobs, manage application of job seekers who have applied.
- **For Job Seeker:** A Job Seeker can apply for the jobs posted by employers, view & delete his job application.

## Technologies

- **Node Js:** Backend run time environment for Javascript.
- **Express Js:** Robust framework for developing reliable backend with Javascript.
- **MongoDB:** A NoSQL database that stores data in JSON-like format.
- **Mongoose:** An Object Data Modeling (ODM) library for MongoDB and Node.js, which provides a schema-based solution to model your data.
- **Cloudinary:** A cloud service to manage and manipulate images and other media files.

## Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/PrasanPoudel/KAAMSETU_Backend.git
   cd KAAMSETU_Backend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start the development server:**

   ```bash
   npm run dev
   ```

   The server should now be running at [http://localhost:4000](http://localhost:4000).

## Folder Structure

```
KAAMSETU_Backend/
├── config/
│   └── config.env
├── controllers/
│   ├── applicationController.js
│   ├── jobController.js
│   ├── userController.js
├── features/
│   ├── jobNotification.js
│   ├── sendEmail.js
├── middlewares/
│   ├── auth.js
│   ├── catchAsyncErrors.js
│   ├── error.js
├── models/
│   ├── applicationSchema.js
│   ├── jobSchema.js
│   ├── userSchema.js
├── mongoDB/
│   ├── connection.js
├── routers/
│   ├── applicationRouter.js
│   ├── jobRouter.js
│   ├── userRouter.js
├── utilities/
│   ├── jwtToken.js
├── .gitignore
├── app.js
├── package-lock.json
├── package.json
├── README.md
├── server.js
```

## Contributing

Contributions are welcomed! Please open an issue or submit a pull request with improvements.

## License

This project is open source and available under the [MIT License](LICENSE).

---

Happy coding!
