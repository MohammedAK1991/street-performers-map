# 🎵 StreetPerformersMap - Product Requirements Document

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Vision & Mission](#vision--mission)
3. [Target Users](#target-users)
4. [Core Features](#core-features)
5. [User Stories](#user-stories)
6. [Technical Requirements](#technical-requirements)
7. [Success Metrics](#success-metrics)
8. [Monetization Strategy](#monetization-strategy)
9. [Competitive Analysis](#competitive-analysis)
10. [Roadmap](#roadmap)

---

## 🎯 Project Overview

**StreetPerformersMap** is a real-time platform connecting street musicians with audiences through an interactive map experience. Musicians can set performance routes, upload short videos, and receive tips, while audiences can discover live performances happening around them.

### **Core Value Proposition**
- **For Musicians**: Increase visibility, build audience, earn tips digitally
- **For Audiences**: Discover amazing live music happening nearby in real-time

---

## 🌟 Vision & Mission

### **Vision**
To become the go-to platform for discovering and supporting street music culture worldwide.

### **Mission**
Empower street musicians to share their art, connect with audiences, and earn a living while creating vibrant cultural experiences in urban spaces.

---

## 👥 Target Users

### **Primary Users: Street Musicians**
- **Demographics**: Ages 18-45, urban areas, independent artists
- **Pain Points**: 
  - Hard to attract audiences
  - Difficult to earn consistent income
  - No way to notify fans of performances
  - Cash-only tips limit earning potential

### **Secondary Users: Music Lovers**
- **Demographics**: Ages 16-60, urban residents and tourists
- **Pain Points**:
  - Missing out on great live performances
  - Don't know where/when performances happen
  - Want to support artists but don't carry cash

---

## 🚀 Core Features

### **For Musicians**

#### **1. Performance Route Planning**
- Set up to 5 performance stops per day
- Interactive map route visualization
- Time scheduling for each stop
- Route highlights on map for audience visibility

#### **2. Video Content**
- Upload max 2 videos per day (30 seconds each)
- TikTok-style vertical video format
- Automatic deletion at end of day
- Mobile-first upload experience

#### **3. Profile & Performance Management**
- Musician profile with genre, bio, social links
- Performance history and statistics
- Daily route reset functionality

### **For Audiences**

#### **1. Interactive Map Discovery**
- Real-time map showing active performances
- Dynamic marker sizing based on popularity
- Color-coded markers for performance timing
- Location-based discovery

#### **2. Filtering & Search**
- Filter by genre (rock, jazz, folk, etc.)
- Filter by time (now, next hour, today)
- Filter by distance radius
- Search by performer name

#### **3. Engagement Features**
- Heart/like performances to show interest
- Instagram-style stories feed for trending performers
- Performance notifications for followed artists

#### **4. Tipping System**
- Integrated Bizum/Stripe payment
- Quick tip amounts (€1, €5, €10, custom)
- Tip history and receipts
- Anonymous or public tipping options

### **Platform Features**

#### **1. Real-time Updates**
- Live performance status updates
- Real-time audience engagement
- Dynamic popularity calculations

#### **2. Trending & Discovery**
- Trending performers dashboard
- Stories feed for popular content
- Recommendation algorithm based on preferences

#### **3. Data & Analytics**
- Performance analytics for musicians
- Audience engagement metrics
- Revenue tracking and reporting

---

## 📖 User Stories

### **Musician Stories**

#### **Epic: Performance Planning**
- **As a musician**, I want to plan my daily performance route so that I can optimize my locations and times
- **As a musician**, I want to set specific times for each stop so that my audience knows when to find me
- **As a musician**, I want my route to be visible on the map so that people can discover my performances

#### **Epic: Content Creation**
- **As a musician**, I want to upload short performance videos so that I can showcase my talent
- **As a musician**, I want my videos to be automatically deleted daily so that my content stays fresh
- **As a musician**, I want to upload videos from my phone without an app so that it's convenient

#### **Epic: Audience Building**
- **As a musician**, I want to see who liked my performances so that I can build a fanbase
- **As a musician**, I want to track my performance analytics so that I can improve my strategy
- **As a musician**, I want to receive tips digitally so that I can earn money without handling cash

### **Audience Stories**

#### **Epic: Discovery**
- **As a music lover**, I want to see what performances are happening nearby so that I can attend them
- **As a music lover**, I want to filter performances by genre so that I can find music I like
- **As a music lover**, I want to see when performances are starting so that I can plan my time

#### **Epic: Engagement**
- **As a music lover**, I want to heart performances I'm interested in so that I can show support
- **As a music lover**, I want to tip performers digitally so that I can support them without cash
- **As a music lover**, I want to follow my favorite performers so that I get notified of their shows

#### **Epic: Content Consumption**
- **As a music lover**, I want to watch performance videos so that I can preview the music
- **As a music lover**, I want to see trending performers so that I can discover popular acts
- **As a music lover**, I want a stories feed so that I can browse content quickly

---

## 🔧 Technical Requirements

### **Frontend Requirements**
- **Framework**: React with TypeScript
- **Routing**: TanStack Router for type-safe routing
- **State Management**: Zustand for lightweight state management
- **UI Components**: Shadcn/ui for modern, accessible components
- **Maps**: React Google Maps for interactive mapping
- **Real-time**: WebSocket connection for live updates
- **Mobile**: Responsive design, PWA capabilities

### **Backend Requirements**
- **Architecture**: Domain-Driven Design (DDD) with Express.js
- **Language**: Node.js with TypeScript
- **Database**: MongoDB for content, PostgreSQL for transactions
- **Message Queue**: Apache Kafka for event-driven architecture
- **Real-time**: WebSocket server for live updates
- **File Storage**: AWS S3 for video storage
- **CDN**: CloudFront for global video delivery

### **Infrastructure Requirements**
- **Container Orchestration**: Kubernetes for microservices
- **Auto-scaling**: Horizontal Pod Autoscaler (HPA)
- **Service Mesh**: Istio for service communication
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana)

### **Third-party Integrations**
- **Maps**: Google Maps Platform
- **Payments**: Stripe for international, Bizum for Spain
- **Authentication**: Auth0 or Firebase Auth
- **Video Processing**: FFmpeg for video optimization
- **Push Notifications**: Firebase Cloud Messaging

---

## 📊 Success Metrics

### **Engagement Metrics**
- **Daily Active Users (DAU)**: Target 10K users in first 6 months
- **Session Duration**: Average 15+ minutes per session
- **Return Rate**: 70% weekly return rate for performers
- **Content Creation**: 500+ videos uploaded daily

### **Business Metrics**
- **Revenue**: €50K monthly recurring revenue in first year
- **Transaction Volume**: €100K in tips processed monthly
- **User Growth**: 50% month-over-month growth in first 6 months
- **Market Penetration**: 25% of street musicians in target cities

### **Quality Metrics**
- **App Performance**: <2 second load times
- **Uptime**: 99.9% availability
- **User Satisfaction**: 4.5+ star rating
- **Support Response**: <2 hour response time

---

## 💰 Monetization Strategy

### **Primary Revenue Streams**

#### **1. Transaction Fees (70% of revenue)**
- 3% fee on all tips processed
- Lower fees for high-volume performers
- Premium payment processing for instant payouts

#### **2. Premium Subscriptions (20% of revenue)**
- **Performer Pro (€9.99/month)**:
  - Unlimited video uploads
  - Advanced analytics
  - Priority map placement
  - Custom branding
  - Performance scheduling tools

#### **3. Sponsored Content (10% of revenue)**
- Local business sponsorships
- Music venue partnerships
- Festival and event promotions
- Targeted advertising based on location/genre

### **Future Revenue Opportunities**
- Merchandise marketplace
- Event booking platform
- Music lesson connections
- Equipment rental partnerships

---

## 🏆 Competitive Analysis

### **Direct Competitors**

#### **Busker.io**
- **Strengths**: Established community, good performer tools
- **Weaknesses**: Limited real-time features, poor mobile experience
- **Opportunity**: Better UX, real-time updates, integrated payments

#### **StreetMusicMap**
- **Strengths**: Simple interface, good map visualization
- **Weaknesses**: No video content, limited engagement features
- **Opportunity**: Rich media content, social features

### **Indirect Competitors**

#### **TikTok/Instagram**
- **Strengths**: Massive user base, excellent content discovery
- **Weaknesses**: No location-based discovery, no direct tipping
- **Opportunity**: Location-first experience, direct monetization

#### **Spotify Live**
- **Strengths**: Music focus, large audience
- **Weaknesses**: Not street performance focused, no location features
- **Opportunity**: Hyperlocal focus, in-person experience

---

## 🗓️ Roadmap

### **Phase 1: MVP (Months 1-3)**
- Basic map with performer locations
- Simple video upload and viewing
- Basic tipping functionality
- User authentication and profiles

### **Phase 2: Core Features (Months 4-6)**
- Route planning and scheduling
- Real-time updates via WebSocket
- Advanced filtering and search
- Stories feed for trending content

### **Phase 3: Growth Features (Months 7-9)**
- Push notifications
- Advanced analytics
- Premium subscriptions
- Social sharing features

### **Phase 4: Scale & Optimize (Months 10-12)**
- Multi-city expansion
- Advanced recommendation engine
- Marketplace features
- B2B partnerships

---

## 🎯 Success Criteria

### **Technical Success**
- ✅ App loads in <2 seconds
- ✅ 99.9% uptime achieved
- ✅ Real-time updates work seamlessly
- ✅ Payment processing is secure and fast

### **Product Success**
- ✅ 10K+ registered users in first 6 months
- ✅ 500+ daily video uploads
- ✅ €50K+ monthly transaction volume
- ✅ 4.5+ star app store rating

### **Business Success**
- ✅ €100K+ annual recurring revenue
- ✅ Positive unit economics
- ✅ Market leadership in 3 major cities
- ✅ Strategic partnerships established

---

## 🚀 Next Steps

1. **Technical Architecture Design**
2. **UI/UX Wireframes and Mockups**
3. **Development Task Breakdown**
4. **MVP Development Sprint Planning**
5. **User Testing and Feedback Collection**

---

*This PRD serves as the foundation for building StreetPerformersMap - a platform that will revolutionize how street music is discovered, experienced, and supported.*
