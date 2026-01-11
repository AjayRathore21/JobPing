const serverlessConfig = {
  service: "jobping",
  useDotenv: true,
  provider: {
    name: "aws",
    runtime: "nodejs20.x",
    region: "ap-south-1",
    stage: "prod",
    environment: {
      NODE_ENV: "production",
      BACKEND_URL: "${env:BACKEND_URL, ''}",
      MONGODB_URI: "${env:MONGODB_URI, ''}",
      GOOGLE_CLIENT_ID: "${env:GOOGLE_CLIENT_ID, ''}",
      GOOGLE_CLIENT_SECRET: "${env:GOOGLE_CLIENT_SECRET, ''}",
      JWT_SECRET_KEY: "${env:JWT_SECRET_KEY, ''}",
      FRONTEND_URL: "${env:FRONTEND_URL, ''}",
      GOOGLE_CALLBACK_URL: "${env:GOOGLE_CALLBACK_URL, ''}",
      CLOUDINARY_CLOUD_NAME: "${env:CLOUDINARY_CLOUD_NAME, ''}",
      CLOUDINARY_API_KEY: "${env:CLOUDINARY_API_KEY, ''}",
      CLOUDINARY_API_SECRET: "${env:CLOUDINARY_API_SECRET, ''}",
      CLOUDINARY_URL: "${env:CLOUDINARY_URL, ''}",
    },
  },
  functions: {
    api: {
      name: "jobping",
      handler: "index.handler",
      timeout: 29,
      events: [
        {
          http: {
            path: "/",
            method: "any",
            cors: true,
          },
        },
        {
          http: {
            path: "/{proxy+}",
            method: "any",
            cors: true,
          },
        },
      ],
    },
  },
  plugins: ["serverless-dotenv-plugin"],
  package: {
    patterns: ["!test/**", "!.git/**", "!node_modules/.bin/**"],
  },
};

// Only load serverless-offline when running locally (not in GitHub Actions)
if (!process.env.GITHUB_ACTIONS) {
  serverlessConfig.plugins.push("serverless-offline");
  serverlessConfig.custom = {
    "serverless-offline": {
      noPrependStageInUrl: true,
    },
  };
}

module.exports = serverlessConfig;
