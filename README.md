# Quantity Measurement System (QMA) – Frontend

A modern, responsive, and performance-optimized frontend application for performing quantity conversions, arithmetic operations, and tracking user activity. Built using Angular with a focus on scalability, clean architecture, and seamless integration with microservices.

---

## Overview

The Quantity Measurement System frontend provides an intuitive interface for interacting with backend microservices. It enables users to perform measurement operations efficiently while ensuring a smooth and responsive user experience.

The application supports:

* Unit conversion across multiple categories
* Arithmetic operations on quantities
* User authentication and session handling
* Operation history tracking
* Responsive and accessible UI

---

## Key Features

### Real-Time Operations

* Instant unit conversion with accurate results
* Arithmetic operations with automatic handling

### Authentication Integration

* JWT-based authentication support
* Token management using HTTP interceptors

### Operation History

* Displays user-specific operation history
* Structured and easy-to-read interface

### Responsive Design

* Fully optimized for desktop, tablet, and mobile devices
* Clean and consistent UI using Tailwind CSS

### State Management

* Efficient state handling using Angular Signals

---

## Technology Stack

| Category         | Technology                |
| ---------------- | ------------------------- |
| Framework        | Angular                   |
| Styling          | Tailwind CSS              |
| State Management | Angular Signals           |
| API Handling     | HttpClient + Interceptors |
| Build Tool       | Angular CLI               |
| Deployment       | Render / AWS S3           |

---

## Architecture & Design

The frontend follows a modular and scalable architecture:

* Component-based design using Angular standalone components
* Separation of concerns (UI, services, utilities)
* Centralized API communication layer
* Reusable components for maintainability
* Efficient state updates using Signals

---

## Project Structure

```id="ngfrt1"
src/
│
├── app/
│   ├── components/        # Reusable UI components
│   ├── pages/             # Feature pages (login, dashboard, calculator)
│   ├── services/          # API communication services
│   ├── interceptors/      # HTTP interceptors (JWT handling)
│   ├── models/            # Data models / interfaces
│   ├── utils/             # Helper functions
│   │
│   ├── app.component.ts
│   └── app.routes.ts
│
├── assets/                # Static assets
├── environments/          # Environment configurations
│
├── main.ts                # Application entry point
├── index.html
└── styles.css
```

---

## API Integration

All backend communication is handled using Angular HttpClient.

* Base API URL is configured in environment files
* JWT token is automatically attached using HTTP interceptors

### Example Configuration

```ts id="ngapi1"
export const environment = {
  production: true,
  apiUrl: 'http://YOUR_BACKEND_URL'
};
```

---

## Setup and Installation

### Prerequisites

* Node.js
* Angular CLI

### Clone Repository

```bash id="ngcmd1"
git clone https://github.com/kanhiya-sh/QuantityMeasurementApp-Frontend.git
```

### Install Dependencies

```bash id="ngcmd2"
npm install
```

### Run Locally

```bash id="ngcmd3"
ng serve
```

Application will be available at:

```id="ngurl1"
http://localhost:4200
```

---

## Production Build

```bash id="ngcmd4"
ng build --configuration production
```

---

## Deployment

The frontend is deployed using:

* Render (Dockerized Angular build with Nginx)
* AWS S3 (for static hosting, optional setup)

---

## Design Principles

* Clean and maintainable code structure
* Reusable and modular components
* Optimized API communication
* Separation of business logic and UI
* Scalable for future enhancements

---

## Future Enhancements

* OAuth integration (Google Login)
* Advanced analytics dashboard
* Additional unit categories
* Progressive Web App (PWA) support
* Multi-language support

---

## Author

Kanhiya Sharma
B.Tech CSE (Cloud Computing and Virtualization)

