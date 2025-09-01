Here’s the updated **README.md** reflecting that **Supabase Auth** is used instead of OpenID:

---

# Travectio Fleet Management System

## 📌 Overview

Travectio is an **Enterprise SaaS Fleet Management Platform** designed for trucking companies to manage operations, track loads, analyze profitability, and ensure compliance with industry regulations. It supports **multi-tenant architecture**, **real-time analytics**, and **integrations with ELD and load boards**.

---

## ✅ Key Features

### **1. Authentication & Authorization**

- **Supabase Auth** for secure authentication
- Email/password login and magic links
- Role-based access control (Founder, Customer, Demo users)
- Multi-tenant support with row-level security (RLS)
- Session management and token-based authentication

---

### **2. Fleet Management**

- Truck registration with equipment details
- Track **fixed and variable operational costs**
- **Real-time cost-per-mile calculation**
- Truck editing and deletion
- Maintain **truck operational history**
- Driver assignment to trucks

---

### **3. Load Management**

- Record load details (**origin, destination, cargo**)
- **Automatic load profitability calculation**
- Track **deadhead miles and costs**
- Load editing and history maintenance
- **Distance calculation using geographic coordinates**
- Route optimization for efficiency

---

### **4. Analytics & Reporting**

- **Real-time operational dashboards**
- Fleet-wide performance metrics
- Time-based filters (**weekly, monthly, quarterly, yearly**)
- Track **revenue, costs, and profit margins**
- **Cross-tab data synchronization**
- Export analytics data

---

### **5. Load Board Integration**

- Integrate with major load boards:

  - DAT Power
  - Truckstop.com
  - 123Loadboard
  - SuperDispatch

- Unified load search interface
- **Per-truck load board preferences**

---

### **6. ELD Integration**

- Connect with major ELD providers:

  - Samsara
  - KeepTruckin/Motive
  - Garmin

- Track **HOS (Hours of Service) compliance**
- Monitor **driver duty status**
- Per-truck ELD configuration

---

### **7. User Interface**

- **Responsive and mobile-friendly**
- Dark mode support
- Sidebar navigation
- Real-time data updates
- **Offline functionality with sync**
- Customizable dashboards

---

### **8. Security**

- **Supabase authentication with Row-Level Security**
- **Encrypted data at rest and in transit (HTTPS/TLS)**
- Role-based access control (RBAC)
- API key & secret protection
- Data privacy compliance (GDPR-like)
- **Audit logs for all admin actions**

---

### **9. Performance & Scalability**

- Page load time under 3 seconds
- API response under 1 second
- Supports **50+ concurrent users**
- Scales to **1000+ vehicles per customer**
- Cloud auto-scaling with horizontal scaling

---

### **10. Integrations**

- **Load Board APIs**
- **ELD Provider APIs**
- **OpenAI API** (for intelligent features)
- Handles **rate-limiting and error recovery**

---

### **11. Technical Stack**

- **Frontend:** React 18.3.1, TypeScript, Tailwind CSS, React Query, Vite
- **Backend:** Node.js 20.19.3, Express.js, TypeScript
- **Database & Auth:** Supabase (PostgreSQL backend, Auth, Realtime, Storage)

---

### **12. Compliance**

- FMCSA Hours of Service regulations
- DOT Commercial Vehicle Safety Standards
- ELD mandate compliance
- CDL tracking & vehicle inspection records
- Data privacy & security standards

---

## 🛠 Installation & Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-repo/travectio.git
   cd travectio
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY`
   - Any other required secrets

4. **Run development server**

   ```bash
   npm run dev
   ```
