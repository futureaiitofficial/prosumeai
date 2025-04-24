import {
  users, type User, type InsertUser,
  resumes, type Resume, type InsertResume,
  coverLetters, type CoverLetter, type InsertCoverLetter,
  jobApplications, type JobApplication, type InsertJobApplication,
  jobDescriptions, type JobDescription, type InsertJobDescription,
  appSettings, type AppSetting,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, count } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import pg from "pg";

// Create the connection pool
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

const PostgresSessionStore = connectPg(session);

// Define interface for storage operations (simplified)
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | null>;
  getUserByUsername(username: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  createUser(userData: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | null>;
  getAllUsers(): Promise<User[]>;
  
  // Resume methods
  getResume(id: number): Promise<Resume | null>;
  getResumes(userId: number): Promise<Resume[]>;
  createResume(resumeData: InsertResume): Promise<Resume>;
  updateResume(id: number, resumeData: Partial<Resume>): Promise<Resume | null>;
  deleteResume(id: number): Promise<boolean>;
  getResumeCount(userId: number): Promise<number>;
  
  // Cover letter methods
  getCoverLetter(id: number): Promise<CoverLetter | null>;
  getCoverLetters(userId: number): Promise<CoverLetter[]>;
  createCoverLetter(coverLetterData: InsertCoverLetter): Promise<CoverLetter>;
  updateCoverLetter(id: number, coverLetterData: Partial<CoverLetter>): Promise<CoverLetter | null>;
  deleteCoverLetter(id: number): Promise<boolean>;
  getCoverLetterCount(userId: number): Promise<number>;
  
  // Job description methods
  getJobDescription(id: number): Promise<JobDescription | null>;
  getJobDescriptions(userId: number): Promise<JobDescription[]>;
  createJobDescription(jobDescriptionData: InsertJobDescription): Promise<JobDescription>;
  updateJobDescription(id: number, jobDescriptionData: Partial<JobDescription>): Promise<JobDescription | null>;
  deleteJobDescription(id: number): Promise<boolean>;
  
  // Job application methods
  getJobApplication(id: number): Promise<JobApplication | null>;
  getJobApplications(userId: number): Promise<JobApplication[]>;
  createJobApplication(jobApplicationData: InsertJobApplication): Promise<JobApplication>;
  updateJobApplication(id: number, jobApplicationData: Partial<JobApplication>): Promise<JobApplication | null>;
  deleteJobApplication(id: number): Promise<boolean>;
  getJobApplicationCount(userId: number): Promise<number>;
  
  // App Settings methods
  getAppSettings(category?: string): Promise<AppSetting[]>;
  getAppSetting(key: string): Promise<AppSetting | null>;
  upsertAppSetting(key: string, value: any, category: string): Promise<AppSetting | null>;
  deleteAppSetting(key: string): Promise<boolean>;
  
  // Session store
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  // Session store
  public sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
  }

  // User methods (Simplified - rely on schema change to remove fields)
  async getUser(id: number): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || null; // Return as is
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || null; // Return as is
  }
  
  async getUserByEmail(email: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || null; // Return as is
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const now = new Date();
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        updatedAt: now
      })
      .returning();
    return user; // Return as is
  }
  
  async updateUser(id: number, data: Partial<User>): Promise<User | null> {
    const [updatedUser] = await db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    return updatedUser || null; // Return as is
  }
  
  async getAllUsers(): Promise<User[]> {
     return db.select().from(users); // Return as is
  }
  
  // User statistics methods
  async getUserStatistics(): Promise<any> {
    try {
      // Get total counts
      const userCount = await db.select({ count: sql`count(*)` }).from(users);
      const resumeCount = await db.select({ count: sql`count(*)` }).from(resumes);
      const coverLetterCount = await db.select({ count: sql`count(*)` }).from(coverLetters);
      const jobApplicationCount = await db.select({ count: sql`count(*)` }).from(jobApplications);
      
      // Get recent user registrations (last 7 days)
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      
      const recentUsers = await db.select({ count: sql`count(*)` })
        .from(users)
        .where(sql`"created_at" > ${lastWeek.toISOString()}`);
      
      // Get users who have logged in recently (last 7 days)
      const recentLogins = await db.select({ count: sql`count(*)` })
        .from(users)
        .where(sql`"last_login" > ${lastWeek.toISOString()}`);
      
      return {
        totalUsers: userCount[0]?.count || 0,
        totalResumes: resumeCount[0]?.count || 0,
        totalCoverLetters: coverLetterCount[0]?.count || 0,
        totalJobApplications: jobApplicationCount[0]?.count || 0,
        recentRegistrations: recentUsers[0]?.count || 0,
        recentLogins: recentLogins[0]?.count || 0
      };
    } catch (error) {
      console.error("Error getting user statistics:", error);
      return {
        totalUsers: 0,
        totalResumes: 0,
        totalCoverLetters: 0,
        totalJobApplications: 0,
        recentRegistrations: 0,
        recentLogins: 0,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
  
  // Session methods
  async getActiveSessions(): Promise<any[]> {
    try {
      // Get active sessions from the session store
      if (!this.sessionStore) {
        return [];
      }
      
      // This implementation depends on the session store
      // For PostgreSQL session store, we can query the session table
      const activeSessions = await db.execute(
        sql`SELECT sid, sess, expire FROM session WHERE expire > NOW()`
      );
      
      // Parse session data
      return activeSessions.map((session: any) => {
        try {
          // Session data is typically stored as JSON
          const sessionData = typeof session.sess === 'string' 
            ? JSON.parse(session.sess) 
            : session.sess;
            
          return {
            id: session.sid,
            userId: sessionData.passport?.user,
            expires: new Date(session.expire).toISOString(),
            createdAt: sessionData.cookie?._expires 
              ? new Date(sessionData.cookie._expires).toISOString() 
              : null
          };
        } catch (e) {
          return {
            id: session.sid,
            error: "Failed to parse session data"
          };
        }
      });
    } catch (error) {
      console.error("Error getting active sessions:", error);
      return [];
    }
  }
  
  // Job Description methods
  async getJobDescription(id: number): Promise<JobDescription | null> {
    const [jobDescription] = await db.select().from(jobDescriptions).where(eq(jobDescriptions.id, id));
    return jobDescription;
  }
  
  async getJobDescriptions(userId: number): Promise<JobDescription[]> {
    return db.select().from(jobDescriptions).where(eq(jobDescriptions.userId, userId));
  }
  
  async createJobDescription(insertJobDescription: InsertJobDescription): Promise<JobDescription> {
    const now = new Date();
    const [jobDescription] = await db
      .insert(jobDescriptions)
      .values({
        ...insertJobDescription,
        updatedAt: now
      })
      .returning();
    return jobDescription;
  }
  
  async updateJobDescription(id: number, data: Partial<JobDescription>): Promise<JobDescription | null> {
    const [updatedJobDescription] = await db
      .update(jobDescriptions)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(jobDescriptions.id, id))
      .returning();
    return updatedJobDescription;
  }
  
  async deleteJobDescription(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(jobDescriptions)
      .where(eq(jobDescriptions.id, id))
      .returning({ id: jobDescriptions.id });
    return !!deleted;
  }
  
  // Resume methods
  async getResume(id: number): Promise<Resume | null> {
    const [resume] = await db.select().from(resumes).where(eq(resumes.id, id));
    return resume;
  }
  
  async getResumes(userId: number): Promise<Resume[]> {
    return db.select().from(resumes).where(eq(resumes.userId, userId));
  }
  
  async createResume(insertResume: InsertResume): Promise<Resume> {
    const now = new Date();
    const [resume] = await db
      .insert(resumes)
      .values({
        ...insertResume,
        updatedAt: now
      })
      .returning();
    return resume;
  }
  
  async updateResume(id: number, data: Partial<Resume>): Promise<Resume | null> {
    try {
      const processedData = { ...data };
      if (processedData.createdAt && !(processedData.createdAt instanceof Date)) {
        delete processedData.createdAt;
      }
      if (processedData.workExperience && Array.isArray(processedData.workExperience)) {
        processedData.workExperience = processedData.workExperience.map((exp: any) => ({ ...exp }));
      }
      if (processedData.education && Array.isArray(processedData.education)) {
        processedData.education = processedData.education.map((edu: any) => ({ ...edu }));
      }
      if (processedData.certifications && Array.isArray(processedData.certifications)) {
        processedData.certifications = processedData.certifications.map((cert: any) => ({ ...cert }));
      }
      if (processedData.projects && Array.isArray(processedData.projects)) {
        processedData.projects = processedData.projects.map((proj: any) => ({ ...proj }));
      }
      const [updatedResume] = await db
        .update(resumes)
        .set({
          ...processedData,
          updatedAt: new Date()
        })
        .where(eq(resumes.id, id))
        .returning();
      return updatedResume;
    } catch (error) {
      console.error("Error updating resume:", error);
      throw error;
    }
  }
  
  async deleteResume(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(resumes)
      .where(eq(resumes.id, id))
      .returning({ id: resumes.id });
    return !!deleted;
  }
  
  async getResumeCount(userId: number): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(resumes)
      .where(eq(resumes.userId, userId));
    return result?.count || 0;
  }
  
  // Cover Letter methods
  async getCoverLetter(id: number): Promise<CoverLetter | null> {
    const [coverLetter] = await db.select().from(coverLetters).where(eq(coverLetters.id, id));
    return coverLetter;
  }
  
  async getCoverLetters(userId: number): Promise<CoverLetter[]> {
    return db.select().from(coverLetters).where(eq(coverLetters.userId, userId));
  }
  
  async createCoverLetter(insertCoverLetter: InsertCoverLetter): Promise<CoverLetter> {
    const now = new Date();
    const [coverLetter] = await db
      .insert(coverLetters)
      .values({
        ...insertCoverLetter,
        updatedAt: now
      })
      .returning();
    return coverLetter;
  }
  
  async updateCoverLetter(id: number, data: Partial<CoverLetter>): Promise<CoverLetter | null> {
    const [updatedCoverLetter] = await db
      .update(coverLetters)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(coverLetters.id, id))
      .returning();
    return updatedCoverLetter;
  }
  
  async deleteCoverLetter(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(coverLetters)
      .where(eq(coverLetters.id, id))
      .returning({ id: coverLetters.id });
    return !!deleted;
  }
  
  async getCoverLetterCount(userId: number): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(coverLetters)
      .where(eq(coverLetters.userId, userId));
    return result?.count || 0;
  }
  
  // Job Application methods
  async getJobApplication(id: number): Promise<JobApplication | null> {
    try {
      const result = await db.execute(sql`
        SELECT * FROM job_applications WHERE id = ${id}
      `);
      if (result.length === 0) return null;
      const row = result[0];
      return {
        id: Number(row.id),
        userId: Number(row.user_id),
        company: String(row.company),
        jobTitle: String(row.job_title),
        jobDescription: row.job_description ? String(row.job_description) : "",
        location: row.location ? String(row.location) : "",
        workType: row.work_type ? String(row.work_type) : "",
        salary: row.salary ? String(row.salary) : "",
        jobUrl: row.job_url ? String(row.job_url) : "",
        status: String(row.status),
        statusHistory: row.status_history ? (typeof row.status_history === 'object' ? row.status_history : JSON.parse(String(row.status_history))) : [],
        appliedAt: row.applied_at ? new Date(String(row.applied_at)) : new Date(),
        resumeId: row.resume_id ? Number(row.resume_id) : null,
        coverLetterId: row.cover_letter_id ? Number(row.cover_letter_id) : null,
        contactName: row.contact_name ? String(row.contact_name) : "",
        contactEmail: row.contact_email ? String(row.contact_email) : "",
        contactPhone: row.contact_phone ? String(row.contact_phone) : "",
        notes: row.notes ? String(row.notes) : "",
        priority: row.priority ? String(row.priority) : "medium",
        deadlineDate: row.deadline_date ? new Date(String(row.deadline_date)) : null,
        interviewDate: row.interview_date ? new Date(String(row.interview_date)) : null,
        interviewType: row.interview_type ? String(row.interview_type) : "",
        interviewNotes: row.interview_notes ? String(row.interview_notes) : "",
        updatedAt: row.updated_at ? new Date(String(row.updated_at)) : new Date()
      };
    } catch (error) {
      console.error("Error fetching job application:", error);
      return null;
    }
  }
  
  async getJobApplications(userId: number): Promise<JobApplication[]> {
    try {
      const result = await db.execute(sql`
        SELECT * FROM job_applications WHERE user_id = ${userId}
      `);
      return result.map(row => ({
        id: Number(row.id),
        userId: Number(row.user_id),
        company: String(row.company),
        jobTitle: String(row.job_title),
        jobDescription: row.job_description ? String(row.job_description) : "",
        location: row.location ? String(row.location) : "",
        workType: row.work_type ? String(row.work_type) : "",
        salary: row.salary ? String(row.salary) : "",
        jobUrl: row.job_url ? String(row.job_url) : "",
        status: String(row.status),
        statusHistory: row.status_history ? (typeof row.status_history === 'object' ? row.status_history : JSON.parse(String(row.status_history))) : [], 
        appliedAt: row.applied_at ? new Date(String(row.applied_at)) : new Date(),
        resumeId: row.resume_id ? Number(row.resume_id) : null,
        coverLetterId: row.cover_letter_id ? Number(row.cover_letter_id) : null,
        contactName: row.contact_name ? String(row.contact_name) : "",
        contactEmail: row.contact_email ? String(row.contact_email) : "",
        contactPhone: row.contact_phone ? String(row.contact_phone) : "",
        notes: row.notes ? String(row.notes) : "",
        priority: row.priority ? String(row.priority) : "medium",
        deadlineDate: row.deadline_date ? new Date(String(row.deadline_date)) : null,
        interviewDate: row.interview_date ? new Date(String(row.interview_date)) : null,
        interviewType: row.interview_type ? String(row.interview_type) : "",
        interviewNotes: row.interview_notes ? String(row.interview_notes) : "",
        updatedAt: row.updated_at ? new Date(String(row.updated_at)) : new Date()
      }));
    } catch (error) {
      console.error("Error fetching job applications:", error);
      return [];
    }
  }
  
  async createJobApplication(insertJobApplication: InsertJobApplication): Promise<JobApplication> {
    try {
      const now = new Date();
      const filteredData = {
        userId: insertJobApplication.userId,
        company: insertJobApplication.company,
        jobTitle: insertJobApplication.jobTitle,
        jobDescription: insertJobApplication.jobDescription || null,
        location: insertJobApplication.location || null,
        workType: insertJobApplication.workType || null,
        salary: insertJobApplication.salary || null,
        jobUrl: insertJobApplication.jobUrl || null,
        status: insertJobApplication.status,
        statusHistory: insertJobApplication.statusHistory ? JSON.stringify(insertJobApplication.statusHistory) : null,
        resumeId: insertJobApplication.resumeId || null,
        coverLetterId: insertJobApplication.coverLetterId || null,
        contactName: insertJobApplication.contactName || null,
        contactEmail: insertJobApplication.contactEmail || null,
        contactPhone: insertJobApplication.contactPhone || null,
        notes: insertJobApplication.notes || null,
        priority: insertJobApplication.priority || 'medium',
        deadlineDate: insertJobApplication.deadlineDate ? (typeof insertJobApplication.deadlineDate === 'object' ? (insertJobApplication.deadlineDate as Date).toISOString() : insertJobApplication.deadlineDate) : null,
        interviewDate: insertJobApplication.interviewDate ? (typeof insertJobApplication.interviewDate === 'object' ? (insertJobApplication.interviewDate as Date).toISOString() : insertJobApplication.interviewDate) : null,
        interviewType: insertJobApplication.interviewType || null,
        interviewNotes: insertJobApplication.interviewNotes || null,
        appliedAt: now.toISOString(),
        updatedAt: now.toISOString()
      };
      const result = await db.execute(sql`
        INSERT INTO job_applications (
          user_id, company, job_title, job_description, location, work_type, 
          salary, job_url, status, status_history, resume_id, cover_letter_id, contact_name, 
          contact_email, contact_phone, notes, priority, deadline_date, 
          interview_date, interview_type, interview_notes, applied_at, updated_at
        ) VALUES (
          ${filteredData.userId}, ${filteredData.company}, ${filteredData.jobTitle}, 
          ${filteredData.jobDescription}, ${filteredData.location}, ${filteredData.workType}, 
          ${filteredData.salary}, ${filteredData.jobUrl}, ${filteredData.status}, 
          ${filteredData.statusHistory}, ${filteredData.resumeId}, ${filteredData.coverLetterId}, 
          ${filteredData.contactName}, ${filteredData.contactEmail}, ${filteredData.contactPhone}, 
          ${filteredData.notes}, ${filteredData.priority}, ${filteredData.deadlineDate}, 
          ${filteredData.interviewDate}, ${filteredData.interviewType}, ${filteredData.interviewNotes}, 
          ${filteredData.appliedAt}, ${filteredData.updatedAt}
        ) RETURNING *
      `);
      if (result.length === 0) throw new Error("Failed to create job application");
      const row = result[0];
      return {
        id: Number(row.id),
        userId: Number(row.user_id),
        company: String(row.company),
        jobTitle: String(row.job_title),
        jobDescription: row.job_description ? String(row.job_description) : "",
        location: row.location ? String(row.location) : "",
        workType: row.work_type ? String(row.work_type) : "",
        salary: row.salary ? String(row.salary) : "",
        jobUrl: row.job_url ? String(row.job_url) : "",
        status: String(row.status),
        statusHistory: insertJobApplication.statusHistory || [],
        appliedAt: row.applied_at ? new Date(String(row.applied_at)) : new Date(),
        resumeId: row.resume_id ? Number(row.resume_id) : null,
        coverLetterId: row.cover_letter_id ? Number(row.cover_letter_id) : null,
        contactName: row.contact_name ? String(row.contact_name) : "",
        contactEmail: row.contact_email ? String(row.contact_email) : "",
        contactPhone: row.contact_phone ? String(row.contact_phone) : "",
        notes: row.notes ? String(row.notes) : "",
        priority: row.priority ? String(row.priority) : "medium",
        deadlineDate: row.deadline_date ? new Date(String(row.deadline_date)) : null,
        interviewDate: row.interview_date ? new Date(String(row.interview_date)) : null,
        interviewType: row.interview_type ? String(row.interview_type) : "",
        interviewNotes: row.interview_notes ? String(row.interview_notes) : "",
        updatedAt: row.updated_at ? new Date(String(row.updated_at)) : new Date()
      };
    } catch (error) {
      console.error("Error creating job application:", error);
      throw error;
    }
  }
  
  async updateJobApplication(id: number, data: Partial<JobApplication>): Promise<JobApplication | null> {
    try {
      const filteredData: Record<string, any> = {};
      if (data.company !== undefined) filteredData.company = data.company;
      if (data.jobTitle !== undefined) filteredData.job_title = data.jobTitle;
      if (data.jobDescription !== undefined) filteredData.job_description = data.jobDescription;
      if (data.location !== undefined) filteredData.location = data.location;
      if (data.workType !== undefined) filteredData.work_type = data.workType;
      if (data.salary !== undefined) filteredData.salary = data.salary;
      if (data.jobUrl !== undefined) filteredData.job_url = data.jobUrl;
      if (data.status !== undefined) filteredData.status = data.status;
      if (data.statusHistory !== undefined) {
        filteredData.status_history = typeof data.statusHistory === 'string' ? data.statusHistory : JSON.stringify(data.statusHistory);
      }
      if (data.resumeId !== undefined) filteredData.resume_id = data.resumeId;
      if (data.coverLetterId !== undefined) filteredData.cover_letter_id = data.coverLetterId;
      if (data.contactName !== undefined) filteredData.contact_name = data.contactName;
      if (data.contactEmail !== undefined) filteredData.contact_email = data.contactEmail;
      if (data.contactPhone !== undefined) filteredData.contact_phone = data.contactPhone;
      if (data.notes !== undefined) filteredData.notes = data.notes;
      if (data.priority !== undefined) filteredData.priority = data.priority;
      if (data.deadlineDate !== undefined) {
        filteredData.deadline_date = data.deadlineDate instanceof Date ? data.deadlineDate.toISOString() : data.deadlineDate;
      }
      if (data.interviewDate !== undefined) {
        filteredData.interview_date = data.interviewDate instanceof Date ? data.interviewDate.toISOString() : data.interviewDate;
      }
      if (data.interviewType !== undefined) filteredData.interview_type = data.interviewType;
      if (data.interviewNotes !== undefined) filteredData.interview_notes = data.interviewNotes;
      filteredData.updated_at = new Date().toISOString();
      
      const setClauses = Object.entries(filteredData).map(([key, value]) => sql`${sql.identifier(key)} = ${value === null ? null : String(value)}`);
      if (setClauses.length === 0) return await this.getJobApplication(id);
      
      const setClause = sql.join(setClauses, sql`, `);
      const result = await db.execute(sql`
        UPDATE job_applications
        SET ${setClause}
        WHERE id = ${id}
        RETURNING *
      `);
      
      if (result.length === 0) return null;
      const row = result[0];
      return {
        id: Number(row.id),
        userId: Number(row.user_id),
        company: String(row.company),
        jobTitle: String(row.job_title),
        jobDescription: row.job_description ? String(row.job_description) : "",
        location: row.location ? String(row.location) : "",
        workType: row.work_type ? String(row.work_type) : "",
        salary: row.salary ? String(row.salary) : "",
        jobUrl: row.job_url ? String(row.job_url) : "",
        status: String(row.status),
        statusHistory: row.status_history ? (typeof row.status_history === 'object' ? row.status_history : JSON.parse(String(row.status_history))) : [],
        appliedAt: row.applied_at ? new Date(String(row.applied_at)) : new Date(),
        resumeId: row.resume_id ? Number(row.resume_id) : null,
        coverLetterId: row.cover_letter_id ? Number(row.cover_letter_id) : null,
        contactName: row.contact_name ? String(row.contact_name) : "",
        contactEmail: row.contact_email ? String(row.contact_email) : "",
        contactPhone: row.contact_phone ? String(row.contact_phone) : "",
        notes: row.notes ? String(row.notes) : "",
        priority: row.priority ? String(row.priority) : "medium",
        deadlineDate: row.deadline_date ? new Date(String(row.deadline_date)) : null,
        interviewDate: row.interview_date ? new Date(String(row.interview_date)) : null,
        interviewType: row.interview_type ? String(row.interview_type) : "",
        interviewNotes: row.interview_notes ? String(row.interview_notes) : "",
        updatedAt: row.updated_at ? new Date(String(row.updated_at)) : new Date()
      };
    } catch (error) {
      console.error("Error updating job application:", error);
      return null;
    }
  }
  
  async deleteJobApplication(id: number): Promise<boolean> {
    try {
      const result = await db.execute(sql`
        DELETE FROM job_applications
        WHERE id = ${id}
        RETURNING id
      `);
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting job application:", error);
      return false;
    }
  }
  
  async getJobApplicationCount(userId: number): Promise<number> {
    try {
      const result = await db.execute(sql`
        SELECT COUNT(*) as count FROM job_applications WHERE user_id = ${userId}
      `);
      return result.length > 0 ? Number(result[0].count) : 0;
    } catch (error) {
      console.error("Error counting job applications:", error);
      return 0;
    }
  }
  
  // App Settings methods
  async getAppSettings(category?: string): Promise<AppSetting[]> {
    if (category) {
      return await db.select().from(appSettings).where(eq(appSettings.category, category));
    } else {
      return await db.select().from(appSettings);
    }
  }

  async getAppSetting(key: string): Promise<AppSetting | null> {
    const [setting] = await db.select().from(appSettings).where(eq(appSettings.key, key)).limit(1);
    return setting || null;
  }

  async upsertAppSetting(key: string, value: any, category: string): Promise<AppSetting | null> {
    const existingSetting = await this.getAppSetting(key);
    
    if (existingSetting) {
      const [updatedSetting] = await db
        .update(appSettings)
        .set({
          value,
          category,
          updatedAt: new Date()
        })
        .where(eq(appSettings.key, key))
        .returning();
      return updatedSetting || null;
    } else {
      const [newSetting] = await db
        .insert(appSettings)
        .values({
          key,
          value,
          category,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      return newSetting || null;
    }
  }

  async deleteAppSetting(key: string): Promise<boolean> {
    const result = await db.delete(appSettings).where(eq(appSettings.key, key)).returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();