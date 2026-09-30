# Trace-Guard: Decentralized Cold-Chain Integrity Platform

**Smart India Hackathon 2026**[cite: 2] | **Team:** TORCHBEARERS[cite: 2] | **Problem Statement ID:** 26232[cite: 2]
**Theme:** Transportation and Logistics[cite: 2] | **Category:** Software[cite: 2]

---

## 📖 Overview

Trace-Guard is an affordable, fully integrated IoT tracking ecosystem deployed to ensure uncompromising farm-to-fork traceability in the agricultural and perishable goods supply chain[cite: 2]. By seamlessly coupling ruggedized edge IoT nodes with an immutable consortium blockchain ledger and on-device biometric handoff verification, Trace-Guard actively solves critical data integrity and physical security issues in modern cold-chain logistics[cite: 2].

### Overcoming Industry Bottlenecks
Current market solutions suffer from severe limitations that hinder widespread adoption, particularly for MSMEs:
* **Prohibitive Costs:** Expensive satellite tracking solutions and recurring subscription models destroy the margins of small-scale farmers and logistics providers[cite: 2].
* **Data Vulnerability:** Unencrypted local logs can be easily manipulated or altered during cloud synchronization delays to hide compliance failures[cite: 2].
* **Centralization Risks:** Centralized databases give bad actors absolute authority to alter data and hide temperature or humidity violations[cite: 2].
* **Physical–Digital Gap:** Static QR codes can be easily duplicated, photocopied, and transferred to unverified, expired, or counterfeit product batches[cite: 2].
* **Edge Overkill:** Deploying fragile lab-grade sensors unnecessarily increases hardware costs and leads to rapid failure under harsh, high-vibration transit conditions[cite: 2].

---

## 🌟 Unique Value Proposition (UVP)

Trace-Guard introduces several production-ready features to guarantee absolute data integrity from origin to consumer:

1. **Anti-Cloning CDPs & NFC Tags:** Trace-Guard utilizes standard-looking QR codes embedded with microscopic "Cryptoglyphs"[cite: 2]. If a bad actor attempts to photocopy the QR code to spoof a batch, the photocopier degrades these micro-dots[cite: 2]. The consumer smartphone app instantly flags the lossy copies as fakes, rendering duplication impossible[cite: 2].
2. **Zero-Gas Ledger:** By operating on a private Ethereum (Geth) Proof of Authority (PoA) network, the system eliminates transaction fees entirely while maintaining strict cryptographic immutability for all records[cite: 2].
3. **Preventative Edge Alerts:** The physical IoT nodes feature local BLE and acoustic alarms that actively warn drivers to intervene *before* spoilage limits are breached, preventing cargo loss rather than just logging it[cite: 2].
4. **Offline Biometric Handoffs:** Utilizing on-device TFLite facial recognition, chain-of-custody transfers are securely bound to smart contracts even in cellular dead zones, completely independent of active cloud access[cite: 2].
5. **Cryptographic Edge Buffering:** During network dropouts, telemetry data is cached locally via SQLite and signed securely by an onboard ATECC608 chip[cite: 2]. The system automatically executes MQTT syncing the moment connectivity returns[cite: 2].

---

## ⚙️ System Flow & Architecture

The Trace-Guard ecosystem operates across a highly distributed, offline-resilient architecture bridging physical hardware and blockchain infrastructure:

### 1. Origin & Edge Data Collection
* **Hardware Compute:** Powered by an ESP32-C3-WROOM-02 microcontroller running a custom FreeRTOS implementation[cite: 2].
* **Telemetry Sensors:** Integrates an AHT20 for precise temperature and humidity logging, a LIS3DH for drop/shock detection, and a reed switch for container door breach detection[cite: 2].
* **Hardware Cost Efficiency:** To ensure massive MSME adoption, the fully assembled, IP65-sealed, and battery-powered edge node is engineered to cost exactly ₹857[cite: 2].

### 2. Backend & Ingestion Pipeline
* **API Gateway & Broker:** Python FastAPI handles strict authentication and request routing, while a Mosquitto MQTT broker (QoS 1/2) manages high-throughput telemetry payloads from the fleet[cite: 2].
* **Processing Engine:** Redis handles real-time ingestion queues, feeding into an AI processing engine that validates data, runs spoilage prediction, and triggers regulatory alerts[cite: 2].

### 3. Data Persistence & Ledger
* **Off-Chain Databases:** PostgreSQL and PostGIS manage complex relational user profiles, product metadata, and geospatial tracking paths[cite: 2].
* **Blockchain Core:** The private Ethereum (Geth) PoA ledger stores immutable hashes and state roots, specifically keeping dense time-series data off-chain to maintain high transaction throughput and prevent ledger bloat[cite: 2].

---

## 🌍 Stakeholder Impact

* **Farmers / MSMEs:** Gain affordable, enterprise-grade digital provenance without the prohibitive capital expenditure of legacy tracking systems[cite: 2].
* **Transporters / Drivers:** Receive immediate, offline-capable alerts for environmental breaches to proactively prevent cargo loss during transit[cite: 2].
* **QA Labs:** Access comprehensive, unalterable transit histories to identify specific batches requiring targeted testing, streamlining QA operations[cite: 2].
* **Regulators:** Utilize tamper-evident traceability records to drastically simplify audits, automate compliance verification, and penalize violators[cite: 2].
* **Retailers & Consumers:** Empowered to scan CDP QR labels with any standard smartphone to instantly verify product origin, batch history, and absolute authenticity[cite: 2].

---

## 📁 Web Platform Codebase Structure

This repository houses the comprehensive React-based frontend and Convex backend for the Trace-Guard web ecosystem.

* `/src/components/ui/` - A robust library of accessible frontend UI components built with Radix UI, Framer Motion, and Tailwind CSS.
* `/src/console/` - Dedicated, role-based command centers tailored for specific supply chain actors:
  * `AdminView.tsx`: Global supply chain orchestration and regulatory approval monitoring[cite: 1].
  * `TransporterView.tsx`: Live fleet tracking and active transit telemetry[cite: 1].
  * `ConsumerView.tsx`: Public-facing provenance tracking and authenticity verification[cite: 1].
  * `OperationsConsole.tsx` & `TelemetryCharts.tsx`: Advanced real-time sensor data visualization and infrastructure health monitoring[cite: 1].
* `/src/convex/` - Serverless backend infrastructure, including strict schema validation, database mutations, and OTP authentication (`auth.ts`, `emailOtp.ts`) executing natively on the Convex platform[cite: 1].
* `/src/pages/` - Core application routing components including `Dashboard.tsx`, `Auth.tsx`, `WorkspaceDashboard.tsx`, and `BatchDetail.tsx`[cite: 1].
* `/isolate/` - Static assets, bundled dependencies, layout configurations, and application manifests[cite: 1].

---

## 🚀 Getting Started

### Prerequisites
Ensure your deployment environment has the following installed:
* [Node.js](https://nodejs.org/) (v18 or higher)
* `npm` or `bun` package manager[cite: 1]

### Installation & Deployment
1. **Clone the repository:**
   ```bash
   git clone [https://github.com/bakshivaishvik/sih26232-torchbearers.git](https://github.com/bakshivaishvik/sih26232-torchbearers.git)
   cd sih26232-torchbearers