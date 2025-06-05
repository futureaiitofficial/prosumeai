--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: drizzle; Type: SCHEMA; Schema: -; Owner: raja
--

CREATE SCHEMA drizzle;


ALTER SCHEMA drizzle OWNER TO raja;

--
-- Name: billing_cycle; Type: TYPE; Schema: public; Owner: raja
--

CREATE TYPE public.billing_cycle AS ENUM (
    'MONTHLY',
    'YEARLY'
);


ALTER TYPE public.billing_cycle OWNER TO raja;

--
-- Name: blog_post_status; Type: TYPE; Schema: public; Owner: raja
--

CREATE TYPE public.blog_post_status AS ENUM (
    'draft',
    'published',
    'archived',
    'scheduled'
);


ALTER TYPE public.blog_post_status OWNER TO raja;

--
-- Name: currency; Type: TYPE; Schema: public; Owner: raja
--

CREATE TYPE public.currency AS ENUM (
    'INR',
    'USD'
);


ALTER TYPE public.currency OWNER TO raja;

--
-- Name: dispute_status; Type: TYPE; Schema: public; Owner: raja
--

CREATE TYPE public.dispute_status AS ENUM (
    'OPEN',
    'UNDER_REVIEW',
    'RESOLVED',
    'REJECTED'
);


ALTER TYPE public.dispute_status OWNER TO raja;

--
-- Name: feature_type; Type: TYPE; Schema: public; Owner: raja
--

CREATE TYPE public.feature_type AS ENUM (
    'CORE',
    'PREMIUM',
    'ENTERPRISE',
    'ESSENTIAL',
    'ADVANCED',
    'PROFESSIONAL'
);


ALTER TYPE public.feature_type OWNER TO raja;

--
-- Name: job_application_status; Type: TYPE; Schema: public; Owner: raja
--

CREATE TYPE public.job_application_status AS ENUM (
    'applied',
    'screening',
    'interview',
    'assessment',
    'offer',
    'rejected',
    'accepted'
);


ALTER TYPE public.job_application_status OWNER TO raja;

--
-- Name: limit_type; Type: TYPE; Schema: public; Owner: raja
--

CREATE TYPE public.limit_type AS ENUM (
    'UNLIMITED',
    'COUNT',
    'BOOLEAN'
);


ALTER TYPE public.limit_type OWNER TO raja;

--
-- Name: media_type; Type: TYPE; Schema: public; Owner: raja
--

CREATE TYPE public.media_type AS ENUM (
    'image',
    'video',
    'audio',
    'document',
    'other'
);


ALTER TYPE public.media_type OWNER TO raja;

--
-- Name: notification_category; Type: TYPE; Schema: public; Owner: raja
--

CREATE TYPE public.notification_category AS ENUM (
    'account',
    'resume',
    'cover_letter',
    'job_application',
    'subscription',
    'system',
    'security',
    'payment',
    'admin'
);


ALTER TYPE public.notification_category OWNER TO raja;

--
-- Name: notification_priority; Type: TYPE; Schema: public; Owner: raja
--

CREATE TYPE public.notification_priority AS ENUM (
    'low',
    'normal',
    'high'
);


ALTER TYPE public.notification_priority OWNER TO raja;

--
-- Name: notification_type; Type: TYPE; Schema: public; Owner: raja
--

CREATE TYPE public.notification_type AS ENUM (
    'resume_created',
    'resume_downloaded',
    'resume_shared',
    'cover_letter_created',
    'job_application_created',
    'job_application_updated',
    'subscription_created',
    'subscription_renewed',
    'subscription_expiring',
    'subscription_expired',
    'password_reset',
    'account_update',
    'system_announcement',
    'custom_notification',
    'new_user_registered',
    'new_subscription',
    'payment_received',
    'payment_failed',
    'account_deletion',
    'support_request',
    'server_error',
    'security_alert',
    'admin_action_required',
    'subscription_activated',
    'subscription_cancelled',
    'subscription_grace_period'
);


ALTER TYPE public.notification_type OWNER TO raja;

--
-- Name: payment_gateway; Type: TYPE; Schema: public; Owner: raja
--

CREATE TYPE public.payment_gateway AS ENUM (
    'RAZORPAY',
    'STRIPE',
    'PAYPAL',
    'NONE'
);


ALTER TYPE public.payment_gateway OWNER TO raja;

--
-- Name: TYPE payment_gateway; Type: COMMENT; Schema: public; Owner: raja
--

COMMENT ON TYPE public.payment_gateway IS 'Payment gateways supported including STRIPE, RAZORPAY, PAYPAL, and NONE';


--
-- Name: payment_status; Type: TYPE; Schema: public; Owner: raja
--

CREATE TYPE public.payment_status AS ENUM (
    'PENDING',
    'COMPLETED',
    'FAILED',
    'REFUNDED'
);


ALTER TYPE public.payment_status OWNER TO raja;

--
-- Name: plan_change_type; Type: TYPE; Schema: public; Owner: raja
--

CREATE TYPE public.plan_change_type AS ENUM (
    'UPGRADE',
    'DOWNGRADE'
);


ALTER TYPE public.plan_change_type OWNER TO raja;

--
-- Name: reset_frequency; Type: TYPE; Schema: public; Owner: raja
--

CREATE TYPE public.reset_frequency AS ENUM (
    'NEVER',
    'DAILY',
    'WEEKLY',
    'MONTHLY',
    'YEARLY'
);


ALTER TYPE public.reset_frequency OWNER TO raja;

--
-- Name: subscription_status; Type: TYPE; Schema: public; Owner: raja
--

CREATE TYPE public.subscription_status AS ENUM (
    'ACTIVE',
    'GRACE_PERIOD',
    'EXPIRED',
    'CANCELLED'
);


ALTER TYPE public.subscription_status OWNER TO raja;

--
-- Name: target_region; Type: TYPE; Schema: public; Owner: raja
--

CREATE TYPE public.target_region AS ENUM (
    'INDIA',
    'GLOBAL'
);


ALTER TYPE public.target_region OWNER TO raja;

--
-- Name: tax_type; Type: TYPE; Schema: public; Owner: raja
--

CREATE TYPE public.tax_type AS ENUM (
    'GST',
    'CGST',
    'SGST',
    'IGST'
);


ALTER TYPE public.tax_type OWNER TO raja;

--
-- Name: two_factor_method; Type: TYPE; Schema: public; Owner: raja
--

CREATE TYPE public.two_factor_method AS ENUM (
    'EMAIL',
    'AUTHENTICATOR_APP'
);


ALTER TYPE public.two_factor_method OWNER TO raja;

--
-- Name: map_is_premium(); Type: FUNCTION; Schema: public; Owner: raja
--

CREATE FUNCTION public.map_is_premium() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN
        IF NEW.is_premium = TRUE THEN
          NEW.plan_required := 'premium';
        ELSE
          NEW.plan_required := 'basic';
        END IF;
        RETURN NEW;
      END;
      $$;


ALTER FUNCTION public.map_is_premium() OWNER TO raja;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: __drizzle_migrations; Type: TABLE; Schema: drizzle; Owner: raja
--

CREATE TABLE drizzle.__drizzle_migrations (
    id integer NOT NULL,
    hash text NOT NULL,
    created_at bigint
);


ALTER TABLE drizzle.__drizzle_migrations OWNER TO raja;

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE; Schema: drizzle; Owner: raja
--

CREATE SEQUENCE drizzle.__drizzle_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNER TO raja;

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: drizzle; Owner: raja
--

ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNED BY drizzle.__drizzle_migrations.id;


--
-- Name: api_keys; Type: TABLE; Schema: public; Owner: raja
--

CREATE TABLE public.api_keys (
    id integer NOT NULL,
    name text NOT NULL,
    service text DEFAULT 'openai'::text NOT NULL,
    key text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    last_used timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.api_keys OWNER TO raja;

--
-- Name: api_keys_id_seq; Type: SEQUENCE; Schema: public; Owner: raja
--

CREATE SEQUENCE public.api_keys_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.api_keys_id_seq OWNER TO raja;

--
-- Name: api_keys_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: raja
--

ALTER SEQUENCE public.api_keys_id_seq OWNED BY public.api_keys.id;


--
-- Name: app_settings; Type: TABLE; Schema: public; Owner: raja
--

CREATE TABLE public.app_settings (
    id integer NOT NULL,
    key text NOT NULL,
    value jsonb NOT NULL,
    category text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.app_settings OWNER TO raja;

--
-- Name: app_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: raja
--

CREATE SEQUENCE public.app_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.app_settings_id_seq OWNER TO raja;

--
-- Name: app_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: raja
--

ALTER SEQUENCE public.app_settings_id_seq OWNED BY public.app_settings.id;


--
-- Name: blog_categories; Type: TABLE; Schema: public; Owner: raja
--

CREATE TABLE public.blog_categories (
    id integer NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    parent_id integer,
    seo_title text,
    seo_description text,
    seo_keywords text,
    is_active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    post_count integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.blog_categories OWNER TO raja;

--
-- Name: blog_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: raja
--

CREATE SEQUENCE public.blog_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.blog_categories_id_seq OWNER TO raja;

--
-- Name: blog_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: raja
--

ALTER SEQUENCE public.blog_categories_id_seq OWNED BY public.blog_categories.id;


--
-- Name: blog_comments; Type: TABLE; Schema: public; Owner: raja
--

CREATE TABLE public.blog_comments (
    id integer NOT NULL,
    post_id integer NOT NULL,
    author_name text NOT NULL,
    author_email text NOT NULL,
    author_website text,
    content text NOT NULL,
    parent_id integer,
    is_approved boolean DEFAULT false NOT NULL,
    is_spam boolean DEFAULT false NOT NULL,
    ip_address text,
    user_agent text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.blog_comments OWNER TO raja;

--
-- Name: blog_comments_id_seq; Type: SEQUENCE; Schema: public; Owner: raja
--

CREATE SEQUENCE public.blog_comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.blog_comments_id_seq OWNER TO raja;

--
-- Name: blog_comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: raja
--

ALTER SEQUENCE public.blog_comments_id_seq OWNED BY public.blog_comments.id;


--
-- Name: blog_media; Type: TABLE; Schema: public; Owner: raja
--

CREATE TABLE public.blog_media (
    id integer NOT NULL,
    filename text NOT NULL,
    original_name text NOT NULL,
    mime_type text NOT NULL,
    size integer NOT NULL,
    width integer,
    height integer,
    url text NOT NULL,
    alt text,
    caption text,
    type public.media_type NOT NULL,
    uploaded_by integer NOT NULL,
    is_used boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.blog_media OWNER TO raja;

--
-- Name: blog_media_id_seq; Type: SEQUENCE; Schema: public; Owner: raja
--

CREATE SEQUENCE public.blog_media_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.blog_media_id_seq OWNER TO raja;

--
-- Name: blog_media_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: raja
--

ALTER SEQUENCE public.blog_media_id_seq OWNED BY public.blog_media.id;


--
-- Name: blog_post_tags; Type: TABLE; Schema: public; Owner: raja
--

CREATE TABLE public.blog_post_tags (
    id integer NOT NULL,
    post_id integer NOT NULL,
    tag_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.blog_post_tags OWNER TO raja;

--
-- Name: blog_post_tags_id_seq; Type: SEQUENCE; Schema: public; Owner: raja
--

CREATE SEQUENCE public.blog_post_tags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.blog_post_tags_id_seq OWNER TO raja;

--
-- Name: blog_post_tags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: raja
--

ALTER SEQUENCE public.blog_post_tags_id_seq OWNED BY public.blog_post_tags.id;


--
-- Name: blog_posts; Type: TABLE; Schema: public; Owner: raja
--

CREATE TABLE public.blog_posts (
    id integer NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    excerpt text,
    content text NOT NULL,
    featured_image text,
    featured_image_alt text,
    status public.blog_post_status DEFAULT 'draft'::public.blog_post_status NOT NULL,
    seo_title text,
    seo_description text,
    seo_keywords text,
    meta_tags jsonb DEFAULT '{}'::jsonb,
    canonical_url text,
    allow_comments boolean DEFAULT true NOT NULL,
    is_featured boolean DEFAULT false NOT NULL,
    is_sticky boolean DEFAULT false NOT NULL,
    category_id integer,
    author_id integer NOT NULL,
    published_at timestamp without time zone,
    scheduled_at timestamp without time zone,
    view_count integer DEFAULT 0 NOT NULL,
    read_time integer,
    table_of_contents jsonb,
    custom_fields jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.blog_posts OWNER TO raja;

--
-- Name: blog_posts_id_seq; Type: SEQUENCE; Schema: public; Owner: raja
--

CREATE SEQUENCE public.blog_posts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.blog_posts_id_seq OWNER TO raja;

--
-- Name: blog_posts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: raja
--

ALTER SEQUENCE public.blog_posts_id_seq OWNED BY public.blog_posts.id;


--
-- Name: blog_settings; Type: TABLE; Schema: public; Owner: raja
--

CREATE TABLE public.blog_settings (
    id integer NOT NULL,
    blog_title text DEFAULT 'Blog'::text NOT NULL,
    blog_description text DEFAULT 'Latest news and updates'::text,
    blog_keywords text,
    posts_per_page integer DEFAULT 10 NOT NULL,
    allow_comments boolean DEFAULT true NOT NULL,
    moderate_comments boolean DEFAULT true NOT NULL,
    enable_rss boolean DEFAULT true NOT NULL,
    enable_sitemap boolean DEFAULT true NOT NULL,
    featured_image_required boolean DEFAULT false NOT NULL,
    enable_read_time boolean DEFAULT true NOT NULL,
    enable_table_of_contents boolean DEFAULT true NOT NULL,
    social_share_buttons jsonb DEFAULT '["twitter", "facebook", "linkedin", "email"]'::jsonb,
    custom_css text,
    custom_js text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.blog_settings OWNER TO raja;

--
-- Name: blog_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: raja
--

CREATE SEQUENCE public.blog_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.blog_settings_id_seq OWNER TO raja;

--
-- Name: blog_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: raja
--

ALTER SEQUENCE public.blog_settings_id_seq OWNED BY public.blog_settings.id;


--
-- Name: blog_tags; Type: TABLE; Schema: public; Owner: raja
--

CREATE TABLE public.blog_tags (
    id integer NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    color text DEFAULT '#4f46e5'::text,
    post_count integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.blog_tags OWNER TO raja;

--
-- Name: blog_tags_id_seq; Type: SEQUENCE; Schema: public; Owner: raja
--

CREATE SEQUENCE public.blog_tags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.blog_tags_id_seq OWNER TO raja;

--
-- Name: blog_tags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: raja
--

ALTER SEQUENCE public.blog_tags_id_seq OWNED BY public.blog_tags.id;


--
-- Name: branding_settings; Type: TABLE; Schema: public; Owner: raja
--

CREATE TABLE public.branding_settings (
    id integer NOT NULL,
    app_name text DEFAULT 'ProsumeAI'::text NOT NULL,
    app_tagline text DEFAULT 'AI-powered resume and career tools'::text,
    logo_url text DEFAULT '/logo.png'::text,
    favicon_url text DEFAULT '/favicon.ico'::text,
    enable_dark_mode boolean DEFAULT true NOT NULL,
    primary_color text DEFAULT '#4f46e5'::text NOT NULL,
    secondary_color text DEFAULT '#10b981'::text NOT NULL,
    accent_color text DEFAULT '#f97316'::text NOT NULL,
    footer_text text DEFAULT '© 2023 ProsumeAI. All rights reserved.'::text,
    custom_css text,
    custom_js text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.branding_settings OWNER TO raja;

--
-- Name: branding_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: raja
--

CREATE SEQUENCE public.branding_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.branding_settings_id_seq OWNER TO raja;

--
-- Name: branding_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: raja
--

ALTER SEQUENCE public.branding_settings_id_seq OWNED BY public.branding_settings.id;


--
-- Name: company_tax_info; Type: TABLE; Schema: public; Owner: raja
--

CREATE TABLE public.company_tax_info (
    id integer NOT NULL,
    company_name text NOT NULL,
    address text NOT NULL,
    city text NOT NULL,
    state text NOT NULL,
    country text NOT NULL,
    postal_code text NOT NULL,
    gstin text,
    pan text,
    tax_reg_number text,
    email text NOT NULL,
    phone text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.company_tax_info OWNER TO raja;

--
-- Name: company_tax_info_id_seq; Type: SEQUENCE; Schema: public; Owner: raja
--

CREATE SEQUENCE public.company_tax_info_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.company_tax_info_id_seq OWNER TO raja;

--
-- Name: company_tax_info_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: raja
--

ALTER SEQUENCE public.company_tax_info_id_seq OWNED BY public.company_tax_info.id;


--
-- Name: cover_letter_templates; Type: TABLE; Schema: public; Owner: raja
--

CREATE TABLE public.cover_letter_templates (
    id integer NOT NULL,
    name text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    content text NOT NULL,
    thumbnail text DEFAULT ''::text NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.cover_letter_templates OWNER TO raja;

--
-- Name: cover_letter_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: raja
--

CREATE SEQUENCE public.cover_letter_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cover_letter_templates_id_seq OWNER TO raja;

--
-- Name: cover_letter_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: raja
--

ALTER SEQUENCE public.cover_letter_templates_id_seq OWNED BY public.cover_letter_templates.id;


--
-- Name: cover_letters; Type: TABLE; Schema: public; Owner: raja
--

CREATE TABLE public.cover_letters (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title text NOT NULL,
    job_title text NOT NULL,
    company text NOT NULL,
    recipient_name text,
    full_name text,
    email text,
    phone text,
    address text,
    resume_id integer,
    content text NOT NULL,
    job_description text,
    template text DEFAULT 'standard'::text NOT NULL,
    is_draft boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.cover_letters OWNER TO raja;

--
-- Name: cover_letters_id_seq; Type: SEQUENCE; Schema: public; Owner: raja
--

CREATE SEQUENCE public.cover_letters_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cover_letters_id_seq OWNER TO raja;

--
-- Name: cover_letters_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: raja
--

ALTER SEQUENCE public.cover_letters_id_seq OWNED BY public.cover_letters.id;


--
-- Name: disputes; Type: TABLE; Schema: public; Owner: raja
--

CREATE TABLE public.disputes (
    id integer NOT NULL,
    transaction_id integer NOT NULL,
    user_id integer NOT NULL,
    reason text NOT NULL,
    status public.dispute_status DEFAULT 'OPEN'::public.dispute_status NOT NULL,
    resolution_notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    resolved_at timestamp without time zone
);


ALTER TABLE public.disputes OWNER TO raja;

--
-- Name: disputes_id_seq; Type: SEQUENCE; Schema: public; Owner: raja
--

CREATE SEQUENCE public.disputes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.disputes_id_seq OWNER TO raja;

--
-- Name: disputes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: raja
--

ALTER SEQUENCE public.disputes_id_seq OWNED BY public.disputes.id;


--
-- Name: document_versions; Type: TABLE; Schema: public; Owner: raja
--

CREATE TABLE public.document_versions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    document_id integer NOT NULL,
    document_type text NOT NULL,
    version_number integer NOT NULL,
    content_hash text NOT NULL,
    is_significant_change boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.document_versions OWNER TO raja;

--
-- Name: document_versions_id_seq; Type: SEQUENCE; Schema: public; Owner: raja
--

CREATE SEQUENCE public.document_versions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.document_versions_id_seq OWNER TO raja;

--
-- Name: document_versions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: raja
--

ALTER SEQUENCE public.document_versions_id_seq OWNED BY public.document_versions.id;


--
-- Name: email_templates; Type: TABLE; Schema: public; Owner: raja
--

CREATE TABLE public.email_templates (
    id integer NOT NULL,
    template_type character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    subject character varying(255) NOT NULL,
    html_content text NOT NULL,
    text_content text NOT NULL,
    variables jsonb,
    is_default boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.email_templates OWNER TO raja;

--
-- Name: email_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: raja
--

CREATE SEQUENCE public.email_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.email_templates_id_seq OWNER TO raja;

--
-- Name: email_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: raja
--

ALTER SEQUENCE public.email_templates_id_seq OWNED BY public.email_templates.id;


--
-- Name: feature_usage; Type: TABLE; Schema: public; Owner: raja
--

CREATE TABLE public.feature_usage (
    id integer NOT NULL,
    user_id integer NOT NULL,
    feature_id integer NOT NULL,
    usage_count integer DEFAULT 0 NOT NULL,
    ai_model_type text,
    ai_token_count integer,
    ai_cost numeric(10,4),
    last_used timestamp without time zone DEFAULT now(),
    reset_date timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.feature_usage OWNER TO raja;

--
-- Name: feature_usage_id_seq; Type: SEQUENCE; Schema: public; Owner: raja
--

CREATE SEQUENCE public.feature_usage_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.feature_usage_id_seq OWNER TO raja;

--
-- Name: feature_usage_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: raja
--

ALTER SEQUENCE public.feature_usage_id_seq OWNED BY public.feature_usage.id;


--
-- Name: features; Type: TABLE; Schema: public; Owner: raja
--

CREATE TABLE public.features (
    id integer NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    description text NOT NULL,
    is_countable boolean DEFAULT true NOT NULL,
    cost_factor numeric(10,4) DEFAULT 1.0000,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    feature_type public.feature_type,
    is_token_based boolean DEFAULT false NOT NULL
);


ALTER TABLE public.features OWNER TO raja;

--
-- Name: features_id_seq; Type: SEQUENCE; Schema: public; Owner: raja
--

CREATE SEQUENCE public.features_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.features_id_seq OWNER TO raja;

--
-- Name: features_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: raja
--

ALTER SEQUENCE public.features_id_seq OWNED BY public.features.id;


--
-- Name: invoice_settings; Type: TABLE; Schema: public; Owner: raja
--

CREATE TABLE public.invoice_settings (
    id integer NOT NULL,
    logo_url text,
    footer_text text,
    terms_and_conditions text,
    invoice_prefix text DEFAULT 'INV-'::text NOT NULL,
    show_tax_breakdown boolean DEFAULT true NOT NULL,
    next_invoice_number integer DEFAULT 1000 NOT NULL,
    default_due_days integer DEFAULT 15 NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.invoice_settings OWNER TO raja;

--
-- Name: invoice_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: raja
--

CREATE SEQUENCE public.invoice_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.invoice_settings_id_seq OWNER TO raja;

--
-- Name: invoice_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: raja
--

ALTER SEQUENCE public.invoice_settings_id_seq OWNED BY public.invoice_settings.id;


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: raja
--

CREATE TABLE public.invoices (
    id integer NOT NULL,
    invoice_number text NOT NULL,
    user_id integer NOT NULL,
    transaction_id integer,
    subtotal numeric(10,2) NOT NULL,
    tax_amount numeric(10,2) NOT NULL,
    total numeric(10,2) NOT NULL,
    currency public.currency NOT NULL,
    status text DEFAULT 'paid'::text NOT NULL,
    billing_details jsonb NOT NULL,
    company_details jsonb NOT NULL,
    tax_details jsonb,
    items jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    paid_at timestamp without time zone,
    due_date timestamp without time zone,
    notes text,
    subscription_id integer,
    subscription_plan text,
    next_payment_date timestamp without time zone,
    gateway_transaction_id text,
    razorpay_payment_id text
);


ALTER TABLE public.invoices OWNER TO raja;

--
-- Name: invoices_id_seq; Type: SEQUENCE; Schema: public; Owner: raja
--

CREATE SEQUENCE public.invoices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.invoices_id_seq OWNER TO raja;

--
-- Name: invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: raja
--

ALTER SEQUENCE public.invoices_id_seq OWNED BY public.invoices.id;


--
-- Name: job_applications; Type: TABLE; Schema: public; Owner: raja
--

CREATE TABLE public.job_applications (
    id integer NOT NULL,
    user_id integer NOT NULL,
    company text NOT NULL,
    job_title text NOT NULL,
    job_description text,
    location text,
    work_type text,
    salary text,
    job_url text,
    status public.job_application_status DEFAULT 'applied'::public.job_application_status NOT NULL,
    status_history jsonb,
    applied_at timestamp without time zone DEFAULT now(),
    resume_id integer,
    cover_letter_id integer,
    contact_name text,
    contact_email text,
    contact_phone text,
    notes text,
    priority text,
    deadline_date timestamp without time zone,
    interview_date timestamp without time zone,
    interview_type text,
    interview_notes text,
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.job_applications OWNER TO raja;

--
-- Name: job_applications_id_seq; Type: SEQUENCE; Schema: public; Owner: raja
--

CREATE SEQUENCE public.job_applications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.job_applications_id_seq OWNER TO raja;

--
-- Name: job_applications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: raja
--

ALTER SEQUENCE public.job_applications_id_seq OWNED BY public.job_applications.id;


--
-- Name: job_descriptions; Type: TABLE; Schema: public; Owner: raja
--

CREATE TABLE public.job_descriptions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title text NOT NULL,
    company text NOT NULL,
    description text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.job_descriptions OWNER TO raja;

--
-- Name: job_descriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: raja
--

CREATE SEQUENCE public.job_descriptions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.job_descriptions_id_seq OWNER TO raja;

--
-- Name: job_descriptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: raja
--

ALTER SEQUENCE public.job_descriptions_id_seq OWNED BY public.job_descriptions.id;


--
-- Name: notification_preferences; Type: TABLE; Schema: public; Owner: raja
--

CREATE TABLE public.notification_preferences (
    id integer NOT NULL,
    user_id integer NOT NULL,
    enable_email_notifications boolean DEFAULT true NOT NULL,
    enable_push_notifications boolean DEFAULT true NOT NULL,
    enable_in_app_notifications boolean DEFAULT true NOT NULL,
    account_notifications boolean DEFAULT true NOT NULL,
    resume_notifications boolean DEFAULT true NOT NULL,
    cover_letter_notifications boolean DEFAULT true NOT NULL,
    job_application_notifications boolean DEFAULT true NOT NULL,
    subscription_notifications boolean DEFAULT true NOT NULL,
    system_notifications boolean DEFAULT true NOT NULL,
    daily_digest boolean DEFAULT false NOT NULL,
    weekly_digest boolean DEFAULT false NOT NULL,
    quiet_hours_enabled boolean DEFAULT false NOT NULL,
    quiet_hours_start text DEFAULT '22:00'::text,
    quiet_hours_end text DEFAULT '08:00'::text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    enable_sound_notifications boolean DEFAULT true NOT NULL,
    sound_volume numeric(3,2) DEFAULT 0.30 NOT NULL
);


ALTER TABLE public.notification_preferences OWNER TO raja;

--
-- Name: notification_preferences_id_seq; Type: SEQUENCE; Schema: public; Owner: raja
--

CREATE SEQUENCE public.notification_preferences_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notification_preferences_id_seq OWNER TO raja;

--
-- Name: notification_preferences_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: raja
--

ALTER SEQUENCE public.notification_preferences_id_seq OWNED BY public.notification_preferences.id;


--
-- Name: notification_templates; Type: TABLE; Schema: public; Owner: raja
--

CREATE TABLE public.notification_templates (
    id integer NOT NULL,
    type public.notification_type NOT NULL,
    title_template text NOT NULL,
    message_template text NOT NULL,
    email_subject_template text,
    email_body_template text,
    is_active boolean DEFAULT true NOT NULL,
    variables jsonb DEFAULT '[]'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.notification_templates OWNER TO raja;

--
-- Name: notification_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: raja
--

CREATE SEQUENCE public.notification_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notification_templates_id_seq OWNER TO raja;

--
-- Name: notification_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: raja
--

ALTER SEQUENCE public.notification_templates_id_seq OWNED BY public.notification_templates.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: raja
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    recipient_id integer NOT NULL,
    type public.notification_type NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    data jsonb DEFAULT '{}'::jsonb,
    is_read boolean DEFAULT false NOT NULL,
    is_system boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expires_at timestamp without time zone,
    priority public.notification_priority DEFAULT 'normal'::public.notification_priority NOT NULL,
    category public.notification_category NOT NULL,
    action jsonb
);


ALTER TABLE public.notifications OWNER TO raja;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: raja
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO raja;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: raja
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: payment_gateway_configs; Type: TABLE; Schema: public; Owner: raja
--

CREATE TABLE public.payment_gateway_configs (
    id integer NOT NULL,
    name text NOT NULL,
    service public.payment_gateway NOT NULL,
    key text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    config_options jsonb DEFAULT '{}'::jsonb,
    last_used timestamp without time zone,
    test_mode boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.payment_gateway_configs OWNER TO raja;

--
-- Name: payment_gateway_configs_id_seq; Type: SEQUENCE; Schema: public; Owner: raja
--

CREATE SEQUENCE public.payment_gateway_configs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payment_gateway_configs_id_seq OWNER TO raja;

--
-- Name: payment_gateway_configs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: raja
--

ALTER SEQUENCE public.payment_gateway_configs_id_seq OWNED BY public.payment_gateway_configs.id;


--
-- Name: payment_methods; Type: TABLE; Schema: public; Owner: raja
--

CREATE TABLE public.payment_methods (
    id integer NOT NULL,
    user_id integer NOT NULL,
    gateway public.payment_gateway NOT NULL,
    type text NOT NULL,
    last_four text,
    expiry_month integer,
    expiry_year integer,
    gateway_payment_method_id text NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp without time zone
);


ALTER TABLE public.payment_methods OWNER TO raja;

--
-- Name: payment_methods_id_seq; Type: SEQUENCE; Schema: public; Owner: raja
--

CREATE SEQUENCE public.payment_methods_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payment_methods_id_seq OWNER TO raja;

--
-- Name: payment_methods_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: raja
--

ALTER SEQUENCE public.payment_methods_id_seq OWNED BY public.payment_methods.id;


--
-- Name: payment_transactions; Type: TABLE; Schema: public; Owner: raja
--

CREATE TABLE public.payment_transactions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    subscription_id integer NOT NULL,
    amount numeric(10,2) NOT NULL,
    currency public.currency NOT NULL,
    gateway public.payment_gateway NOT NULL,
    gateway_transaction_id text,
    status public.payment_status DEFAULT 'PENDING'::public.payment_status NOT NULL,
    refund_reason text,
    refund_amount numeric(10,2),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    paypal_order_id text,
    paypal_payer_id text,
    metadata jsonb
);


ALTER TABLE public.payment_transactions OWNER TO raja;

--
-- Name: payment_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: raja
--

CREATE SEQUENCE public.payment_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payment_transactions_id_seq OWNER TO raja;

--
-- Name: payment_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: raja
--

ALTER SEQUENCE public.payment_transactions_id_seq OWNED BY public.payment_transactions.id;


--
-- Name: payment_webhook_events; Type: TABLE; Schema: public; Owner: raja
--

CREATE TABLE public.payment_webhook_events (
    id integer NOT NULL,
    gateway public.payment_gateway NOT NULL,
    event_type text NOT NULL,
    event_id text NOT NULL,
    raw_data jsonb NOT NULL,
    processed boolean DEFAULT false NOT NULL,
    processing_errors text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.payment_webhook_events OWNER TO raja;

--
-- Name: payment_webhook_events_id_seq; Type: SEQUENCE; Schema: public; Owner: raja
--

CREATE SEQUENCE public.payment_webhook_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payment_webhook_events_id_seq OWNER TO raja;

--
-- Name: payment_webhook_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: raja
--

ALTER SEQUENCE public.payment_webhook_events_id_seq OWNED BY public.payment_webhook_events.id;


--
-- Name: plan_features; Type: TABLE; Schema: public; Owner: raja
--

CREATE TABLE public.plan_features (
    id integer NOT NULL,
    plan_id integer NOT NULL,
    feature_id integer NOT NULL,
    limit_type public.limit_type NOT NULL,
    limit_value integer,
    reset_frequency public.reset_frequency,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    is_enabled boolean DEFAULT false NOT NULL
);


ALTER TABLE public.plan_features OWNER TO raja;

--
-- Name: plan_features_id_seq; Type: SEQUENCE; Schema: public; Owner: raja
--

CREATE SEQUENCE public.plan_features_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.plan_features_id_seq OWNER TO raja;

--
-- Name: plan_features_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: raja
--

ALTER SEQUENCE public.plan_features_id_seq OWNED BY public.plan_features.id;


--
-- Name: plan_pricing; Type: TABLE; Schema: public; Owner: raja
--

CREATE TABLE public.plan_pricing (
    id integer NOT NULL,
    plan_id integer NOT NULL,
    target_region public.target_region NOT NULL,
    currency public.currency NOT NULL,
    price numeric(10,2) NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.plan_pricing OWNER TO raja;

--
-- Name: plan_pricing_id_seq; Type: SEQUENCE; Schema: public; Owner: raja
--

CREATE SEQUENCE public.plan_pricing_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.plan_pricing_id_seq OWNER TO raja;

--
-- Name: plan_pricing_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: raja
--

ALTER SEQUENCE public.plan_pricing_id_seq OWNED BY public.plan_pricing.id;


--
-- Name: resume_templates; Type: TABLE; Schema: public; Owner: raja
--

CREATE TABLE public.resume_templates (
    id integer NOT NULL,
    name text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    content text NOT NULL,
    thumbnail text DEFAULT ''::text NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.resume_templates OWNER TO raja;

--
-- Name: resume_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: raja
--

CREATE SEQUENCE public.resume_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.resume_templates_id_seq OWNER TO raja;

--
-- Name: resume_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: raja
--

ALTER SEQUENCE public.resume_templates_id_seq OWNED BY public.resume_templates.id;


--
-- Name: resumes; Type: TABLE; Schema: public; Owner: raja
--

CREATE TABLE public.resumes (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title text NOT NULL,
    target_job_title text NOT NULL,
    company_name text,
    job_description text,
    template text NOT NULL,
    full_name text,
    email text,
    phone text,
    location text,
    country text,
    city text,
    state text,
    linkedin_url text,
    portfolio_url text,
    summary text,
    work_experience jsonb,
    education jsonb,
    skills text[],
    technical_skills text[],
    soft_skills text[],
    use_skill_categories boolean DEFAULT false,
    certifications jsonb,
    projects jsonb,
    keywords_optimization text,
    is_complete boolean DEFAULT false,
    current_step text DEFAULT 'details'::text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    publications jsonb,
    skill_categories jsonb
);


ALTER TABLE public.resumes OWNER TO raja;

--
-- Name: resumes_id_seq; Type: SEQUENCE; Schema: public; Owner: raja
--

CREATE SEQUENCE public.resumes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.resumes_id_seq OWNER TO raja;

--
-- Name: resumes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: raja
--

ALTER SEQUENCE public.resumes_id_seq OWNED BY public.resumes.id;


--
-- Name: session; Type: TABLE; Schema: public; Owner: raja
--

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess jsonb NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


ALTER TABLE public.session OWNER TO raja;

--
-- Name: smtp_settings; Type: TABLE; Schema: public; Owner: raja
--

CREATE TABLE public.smtp_settings (
    id integer NOT NULL,
    host text NOT NULL,
    port text DEFAULT '587'::text NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    encryption text DEFAULT 'tls'::text NOT NULL,
    sender_name text DEFAULT 'ProsumeAI'::text NOT NULL,
    sender_email text DEFAULT 'no-reply@prosumeai.com'::text NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.smtp_settings OWNER TO raja;

--
-- Name: smtp_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: raja
--

CREATE SEQUENCE public.smtp_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.smtp_settings_id_seq OWNER TO raja;

--
-- Name: smtp_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: raja
--

ALTER SEQUENCE public.smtp_settings_id_seq OWNED BY public.smtp_settings.id;


--
-- Name: subscription_plans; Type: TABLE; Schema: public; Owner: raja
--

CREATE TABLE public.subscription_plans (
    id integer NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    price numeric(10,2) NOT NULL,
    billing_cycle public.billing_cycle NOT NULL,
    is_featured boolean DEFAULT false NOT NULL,
    is_freemium boolean DEFAULT false NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.subscription_plans OWNER TO raja;

--
-- Name: subscription_plans_id_seq; Type: SEQUENCE; Schema: public; Owner: raja
--

CREATE SEQUENCE public.subscription_plans_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.subscription_plans_id_seq OWNER TO raja;

--
-- Name: subscription_plans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: raja
--

ALTER SEQUENCE public.subscription_plans_id_seq OWNED BY public.subscription_plans.id;


--
-- Name: tax_settings; Type: TABLE; Schema: public; Owner: raja
--

CREATE TABLE public.tax_settings (
    id integer NOT NULL,
    name text NOT NULL,
    type public.tax_type NOT NULL,
    percentage numeric(5,2) NOT NULL,
    country text NOT NULL,
    state_applicable text,
    enabled boolean DEFAULT true NOT NULL,
    apply_to_region public.target_region NOT NULL,
    apply_currency public.currency NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.tax_settings OWNER TO raja;

--
-- Name: tax_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: raja
--

CREATE SEQUENCE public.tax_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tax_settings_id_seq OWNER TO raja;

--
-- Name: tax_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: raja
--

ALTER SEQUENCE public.tax_settings_id_seq OWNED BY public.tax_settings.id;


--
-- Name: two_factor_authenticator; Type: TABLE; Schema: public; Owner: raja
--

CREATE TABLE public.two_factor_authenticator (
    id integer NOT NULL,
    user_id integer NOT NULL,
    secret text NOT NULL,
    recovery_codes jsonb,
    verified boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.two_factor_authenticator OWNER TO raja;

--
-- Name: two_factor_authenticator_id_seq; Type: SEQUENCE; Schema: public; Owner: raja
--

CREATE SEQUENCE public.two_factor_authenticator_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.two_factor_authenticator_id_seq OWNER TO raja;

--
-- Name: two_factor_authenticator_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: raja
--

ALTER SEQUENCE public.two_factor_authenticator_id_seq OWNED BY public.two_factor_authenticator.id;


--
-- Name: two_factor_backup_codes; Type: TABLE; Schema: public; Owner: raja
--

CREATE TABLE public.two_factor_backup_codes (
    id integer NOT NULL,
    user_id integer NOT NULL,
    code text NOT NULL,
    used boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.two_factor_backup_codes OWNER TO raja;

--
-- Name: two_factor_backup_codes_id_seq; Type: SEQUENCE; Schema: public; Owner: raja
--

CREATE SEQUENCE public.two_factor_backup_codes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.two_factor_backup_codes_id_seq OWNER TO raja;

--
-- Name: two_factor_backup_codes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: raja
--

ALTER SEQUENCE public.two_factor_backup_codes_id_seq OWNED BY public.two_factor_backup_codes.id;


--
-- Name: two_factor_email; Type: TABLE; Schema: public; Owner: raja
--

CREATE TABLE public.two_factor_email (
    id integer NOT NULL,
    user_id integer NOT NULL,
    email text NOT NULL,
    token text,
    token_expires_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.two_factor_email OWNER TO raja;

--
-- Name: two_factor_email_id_seq; Type: SEQUENCE; Schema: public; Owner: raja
--

CREATE SEQUENCE public.two_factor_email_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.two_factor_email_id_seq OWNER TO raja;

--
-- Name: two_factor_email_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: raja
--

ALTER SEQUENCE public.two_factor_email_id_seq OWNED BY public.two_factor_email.id;


--
-- Name: two_factor_policy; Type: TABLE; Schema: public; Owner: raja
--

CREATE TABLE public.two_factor_policy (
    id integer NOT NULL,
    enforce_for_admins boolean DEFAULT false NOT NULL,
    enforce_for_all_users boolean DEFAULT false NOT NULL,
    allowed_methods jsonb DEFAULT '["EMAIL", "AUTHENTICATOR_APP"]'::jsonb NOT NULL,
    remember_device_days integer DEFAULT 30 NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.two_factor_policy OWNER TO raja;

--
-- Name: two_factor_policy_id_seq; Type: SEQUENCE; Schema: public; Owner: raja
--

CREATE SEQUENCE public.two_factor_policy_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.two_factor_policy_id_seq OWNER TO raja;

--
-- Name: two_factor_policy_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: raja
--

ALTER SEQUENCE public.two_factor_policy_id_seq OWNED BY public.two_factor_policy.id;


--
-- Name: two_factor_remembered_devices; Type: TABLE; Schema: public; Owner: raja
--

CREATE TABLE public.two_factor_remembered_devices (
    id integer NOT NULL,
    user_id integer NOT NULL,
    device_identifier text NOT NULL,
    token text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.two_factor_remembered_devices OWNER TO raja;

--
-- Name: two_factor_remembered_devices_id_seq; Type: SEQUENCE; Schema: public; Owner: raja
--

CREATE SEQUENCE public.two_factor_remembered_devices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.two_factor_remembered_devices_id_seq OWNER TO raja;

--
-- Name: two_factor_remembered_devices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: raja
--

ALTER SEQUENCE public.two_factor_remembered_devices_id_seq OWNED BY public.two_factor_remembered_devices.id;


--
-- Name: user_billing_details; Type: TABLE; Schema: public; Owner: raja
--

CREATE TABLE public.user_billing_details (
    id integer NOT NULL,
    user_id integer NOT NULL,
    country text NOT NULL,
    address_line_1 text NOT NULL,
    address_line_2 text,
    city text NOT NULL,
    state text NOT NULL,
    postal_code text NOT NULL,
    phone_number text,
    tax_id text,
    company_name text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    full_name text NOT NULL
);


ALTER TABLE public.user_billing_details OWNER TO raja;

--
-- Name: user_billing_details_id_seq; Type: SEQUENCE; Schema: public; Owner: raja
--

CREATE SEQUENCE public.user_billing_details_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_billing_details_id_seq OWNER TO raja;

--
-- Name: user_billing_details_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: raja
--

ALTER SEQUENCE public.user_billing_details_id_seq OWNED BY public.user_billing_details.id;


--
-- Name: user_subscriptions; Type: TABLE; Schema: public; Owner: raja
--

CREATE TABLE public.user_subscriptions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    plan_id integer NOT NULL,
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone NOT NULL,
    auto_renew boolean DEFAULT true NOT NULL,
    payment_gateway text NOT NULL,
    payment_reference text,
    status public.subscription_status DEFAULT 'ACTIVE'::public.subscription_status NOT NULL,
    is_trial boolean DEFAULT false NOT NULL,
    trial_expiry_date timestamp without time zone,
    converted_from_trial boolean DEFAULT false NOT NULL,
    grace_period_end timestamp without time zone,
    previous_plan_id integer,
    upgrade_date timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    cancel_date timestamp without time zone,
    pending_plan_change_to integer,
    pending_plan_change_date timestamp without time zone,
    pending_plan_change_type public.plan_change_type,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.user_subscriptions OWNER TO raja;

--
-- Name: TABLE user_subscriptions; Type: COMMENT; Schema: public; Owner: raja
--

COMMENT ON TABLE public.user_subscriptions IS 'Stores user subscription data with updated structure to handle payment gateways and cancellation';


--
-- Name: user_subscriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: raja
--

CREATE SEQUENCE public.user_subscriptions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_subscriptions_id_seq OWNER TO raja;

--
-- Name: user_subscriptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: raja
--

ALTER SEQUENCE public.user_subscriptions_id_seq OWNED BY public.user_subscriptions.id;


--
-- Name: user_two_factor; Type: TABLE; Schema: public; Owner: raja
--

CREATE TABLE public.user_two_factor (
    id integer NOT NULL,
    user_id integer NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    preferred_method public.two_factor_method,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_two_factor OWNER TO raja;

--
-- Name: user_two_factor_id_seq; Type: SEQUENCE; Schema: public; Owner: raja
--

CREATE SEQUENCE public.user_two_factor_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_two_factor_id_seq OWNER TO raja;

--
-- Name: user_two_factor_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: raja
--

ALTER SEQUENCE public.user_two_factor_id_seq OWNED BY public.user_two_factor.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: raja
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    full_name text NOT NULL,
    is_admin boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    last_login timestamp without time zone,
    razorpay_customer_id text,
    last_password_change timestamp without time zone,
    password_history jsonb,
    failed_login_attempts integer DEFAULT 0,
    lockout_until timestamp without time zone,
    reset_password_token text,
    reset_password_expiry timestamp without time zone,
    email_verified boolean DEFAULT false,
    email_verification_token text,
    email_verification_expiry timestamp without time zone
);


ALTER TABLE public.users OWNER TO raja;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: raja
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO raja;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: raja
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: __drizzle_migrations id; Type: DEFAULT; Schema: drizzle; Owner: raja
--

ALTER TABLE ONLY drizzle.__drizzle_migrations ALTER COLUMN id SET DEFAULT nextval('drizzle.__drizzle_migrations_id_seq'::regclass);


--
-- Name: api_keys id; Type: DEFAULT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.api_keys ALTER COLUMN id SET DEFAULT nextval('public.api_keys_id_seq'::regclass);


--
-- Name: app_settings id; Type: DEFAULT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.app_settings ALTER COLUMN id SET DEFAULT nextval('public.app_settings_id_seq'::regclass);


--
-- Name: blog_categories id; Type: DEFAULT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.blog_categories ALTER COLUMN id SET DEFAULT nextval('public.blog_categories_id_seq'::regclass);


--
-- Name: blog_comments id; Type: DEFAULT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.blog_comments ALTER COLUMN id SET DEFAULT nextval('public.blog_comments_id_seq'::regclass);


--
-- Name: blog_media id; Type: DEFAULT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.blog_media ALTER COLUMN id SET DEFAULT nextval('public.blog_media_id_seq'::regclass);


--
-- Name: blog_post_tags id; Type: DEFAULT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.blog_post_tags ALTER COLUMN id SET DEFAULT nextval('public.blog_post_tags_id_seq'::regclass);


--
-- Name: blog_posts id; Type: DEFAULT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.blog_posts ALTER COLUMN id SET DEFAULT nextval('public.blog_posts_id_seq'::regclass);


--
-- Name: blog_settings id; Type: DEFAULT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.blog_settings ALTER COLUMN id SET DEFAULT nextval('public.blog_settings_id_seq'::regclass);


--
-- Name: blog_tags id; Type: DEFAULT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.blog_tags ALTER COLUMN id SET DEFAULT nextval('public.blog_tags_id_seq'::regclass);


--
-- Name: branding_settings id; Type: DEFAULT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.branding_settings ALTER COLUMN id SET DEFAULT nextval('public.branding_settings_id_seq'::regclass);


--
-- Name: company_tax_info id; Type: DEFAULT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.company_tax_info ALTER COLUMN id SET DEFAULT nextval('public.company_tax_info_id_seq'::regclass);


--
-- Name: cover_letter_templates id; Type: DEFAULT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.cover_letter_templates ALTER COLUMN id SET DEFAULT nextval('public.cover_letter_templates_id_seq'::regclass);


--
-- Name: cover_letters id; Type: DEFAULT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.cover_letters ALTER COLUMN id SET DEFAULT nextval('public.cover_letters_id_seq'::regclass);


--
-- Name: disputes id; Type: DEFAULT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.disputes ALTER COLUMN id SET DEFAULT nextval('public.disputes_id_seq'::regclass);


--
-- Name: document_versions id; Type: DEFAULT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.document_versions ALTER COLUMN id SET DEFAULT nextval('public.document_versions_id_seq'::regclass);


--
-- Name: email_templates id; Type: DEFAULT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.email_templates ALTER COLUMN id SET DEFAULT nextval('public.email_templates_id_seq'::regclass);


--
-- Name: feature_usage id; Type: DEFAULT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.feature_usage ALTER COLUMN id SET DEFAULT nextval('public.feature_usage_id_seq'::regclass);


--
-- Name: features id; Type: DEFAULT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.features ALTER COLUMN id SET DEFAULT nextval('public.features_id_seq'::regclass);


--
-- Name: invoice_settings id; Type: DEFAULT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.invoice_settings ALTER COLUMN id SET DEFAULT nextval('public.invoice_settings_id_seq'::regclass);


--
-- Name: invoices id; Type: DEFAULT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.invoices ALTER COLUMN id SET DEFAULT nextval('public.invoices_id_seq'::regclass);


--
-- Name: job_applications id; Type: DEFAULT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.job_applications ALTER COLUMN id SET DEFAULT nextval('public.job_applications_id_seq'::regclass);


--
-- Name: job_descriptions id; Type: DEFAULT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.job_descriptions ALTER COLUMN id SET DEFAULT nextval('public.job_descriptions_id_seq'::regclass);


--
-- Name: notification_preferences id; Type: DEFAULT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.notification_preferences ALTER COLUMN id SET DEFAULT nextval('public.notification_preferences_id_seq'::regclass);


--
-- Name: notification_templates id; Type: DEFAULT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.notification_templates ALTER COLUMN id SET DEFAULT nextval('public.notification_templates_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: payment_gateway_configs id; Type: DEFAULT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.payment_gateway_configs ALTER COLUMN id SET DEFAULT nextval('public.payment_gateway_configs_id_seq'::regclass);


--
-- Name: payment_methods id; Type: DEFAULT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.payment_methods ALTER COLUMN id SET DEFAULT nextval('public.payment_methods_id_seq'::regclass);


--
-- Name: payment_transactions id; Type: DEFAULT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.payment_transactions ALTER COLUMN id SET DEFAULT nextval('public.payment_transactions_id_seq'::regclass);


--
-- Name: payment_webhook_events id; Type: DEFAULT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.payment_webhook_events ALTER COLUMN id SET DEFAULT nextval('public.payment_webhook_events_id_seq'::regclass);


--
-- Name: plan_features id; Type: DEFAULT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.plan_features ALTER COLUMN id SET DEFAULT nextval('public.plan_features_id_seq'::regclass);


--
-- Name: plan_pricing id; Type: DEFAULT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.plan_pricing ALTER COLUMN id SET DEFAULT nextval('public.plan_pricing_id_seq'::regclass);


--
-- Name: resume_templates id; Type: DEFAULT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.resume_templates ALTER COLUMN id SET DEFAULT nextval('public.resume_templates_id_seq'::regclass);


--
-- Name: resumes id; Type: DEFAULT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.resumes ALTER COLUMN id SET DEFAULT nextval('public.resumes_id_seq'::regclass);


--
-- Name: smtp_settings id; Type: DEFAULT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.smtp_settings ALTER COLUMN id SET DEFAULT nextval('public.smtp_settings_id_seq'::regclass);


--
-- Name: subscription_plans id; Type: DEFAULT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.subscription_plans ALTER COLUMN id SET DEFAULT nextval('public.subscription_plans_id_seq'::regclass);


--
-- Name: tax_settings id; Type: DEFAULT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.tax_settings ALTER COLUMN id SET DEFAULT nextval('public.tax_settings_id_seq'::regclass);


--
-- Name: two_factor_authenticator id; Type: DEFAULT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.two_factor_authenticator ALTER COLUMN id SET DEFAULT nextval('public.two_factor_authenticator_id_seq'::regclass);


--
-- Name: two_factor_backup_codes id; Type: DEFAULT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.two_factor_backup_codes ALTER COLUMN id SET DEFAULT nextval('public.two_factor_backup_codes_id_seq'::regclass);


--
-- Name: two_factor_email id; Type: DEFAULT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.two_factor_email ALTER COLUMN id SET DEFAULT nextval('public.two_factor_email_id_seq'::regclass);


--
-- Name: two_factor_policy id; Type: DEFAULT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.two_factor_policy ALTER COLUMN id SET DEFAULT nextval('public.two_factor_policy_id_seq'::regclass);


--
-- Name: two_factor_remembered_devices id; Type: DEFAULT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.two_factor_remembered_devices ALTER COLUMN id SET DEFAULT nextval('public.two_factor_remembered_devices_id_seq'::regclass);


--
-- Name: user_billing_details id; Type: DEFAULT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.user_billing_details ALTER COLUMN id SET DEFAULT nextval('public.user_billing_details_id_seq'::regclass);


--
-- Name: user_subscriptions id; Type: DEFAULT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.user_subscriptions ALTER COLUMN id SET DEFAULT nextval('public.user_subscriptions_id_seq'::regclass);


--
-- Name: user_two_factor id; Type: DEFAULT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.user_two_factor ALTER COLUMN id SET DEFAULT nextval('public.user_two_factor_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: __drizzle_migrations; Type: TABLE DATA; Schema: drizzle; Owner: raja
--

COPY drizzle.__drizzle_migrations (id, hash, created_at) FROM stdin;
\.


--
-- Data for Name: api_keys; Type: TABLE DATA; Schema: public; Owner: raja
--

COPY public.api_keys (id, name, service, key, is_active, last_used, created_at, updated_at) FROM stdin;
1	Open API 	openai	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	t	2025-06-04 01:53:02.007	2025-04-17 22:51:41.39	2025-04-17 18:51:41.392087
\.


--
-- Data for Name: app_settings; Type: TABLE DATA; Schema: public; Owner: raja
--

COPY public.app_settings (id, key, value, category, created_at, updated_at) FROM stdin;
1	ip-region-2a02:4780:12:318f::1	{"region": "INDIA", "country": "IN", "currency": "INR", "countryName": "India"}	ip-geolocation	2025-04-28 15:05:16.919718	2025-04-28 15:05:16.919718
2	ip-region-75.128.43.158	{"region": "GLOBAL", "country": "US", "currency": "USD", "countryName": "United States"}	ip-geolocation	2025-05-01 05:24:49.7503	2025-05-01 05:24:49.7503
3	ip-region-47.44.57.106	{"region": "GLOBAL", "country": "US", "currency": "USD", "countryName": "United States"}	ip-geolocation	2025-05-07 17:37:44.545098	2025-05-07 17:37:44.545098
4	encryption_key	{"iv": "9e612d56e9024c87cf5f63a3a600e488", "key": "82738d5309d4d5c67f2b1ef672dc9acb00cf2082dc9abdd7a6691a4a2931e1ad"}	security	2025-05-15 21:23:04.408	2025-05-15 21:23:04.408
93	subscription_downgrade_1_1747770780918	{"userId": 1, "newPrice": 899, "toPlanId": 4, "timestamp": "2025-05-20T19:53:00.918Z", "fromPlanId": 5, "currentPrice": 1799, "isActualDowngrade": true, "isFreemiumDowngrade": false}	subscription_events	2025-05-20 15:53:00.918857	2025-05-20 15:53:00.918857
116	ip-region-::ffff:76.89.193.248	{"region": "GLOBAL", "source": "geojs", "country": "US", "currency": "USD", "countryName": "United States"}	ip-geolocation	2025-05-23 04:36:34.14094	2025-05-23 04:36:34.14094
6	encryption_enabled	true	security	2025-05-15 21:23:04.414	2025-05-16 04:54:09.399
73	user_active_session_27	{"sessionId": "MIoHaqYqftiMWMEihl2GHC_GF_hQ9fnC", "updatedAt": "2025-05-19T07:06:04.963Z"}	session-management	2025-05-19 06:49:49.3	2025-05-19 07:06:04.963
5	data_encryption_config	{"users": {"fields": ["email", "fullName"], "enabled": true}, "resumes": {"fields": ["fullName", "email", "phone", "summary", "workExperience"], "enabled": true}, "coverLetters": {"fields": ["fullName", "email", "phone", "content"], "enabled": true}, "paymentMethods": {"fields": ["lastFour", "gatewayPaymentMethodId"], "enabled": true}, "jobApplications": {"fields": ["contactName", "contactEmail", "contactPhone", "notes", "interviewNotes"], "enabled": true}, "userBillingDetails": {"fields": ["fullName", "addressLine1", "addressLine2", "phoneNumber", "taxId"], "enabled": true}}	security	2025-05-15 21:23:04.412	2025-05-15 21:56:07.056
78	user_active_session_28	{"sessionId": "RYY4fEG0EMKqMuYMKnsyPOH6oXUrBr9b", "updatedAt": "2025-05-20T22:18:04.055Z"}	session-management	2025-05-19 07:36:51.081	2025-05-20 22:18:04.055
8	session_config	{"maxAge": 86400000, "singleSession": true, "absoluteTimeout": 86400000, "inactivityTimeout": 1800000, "freemiumRestrictions": {"enabled": true, "trackDevices": true, "maxAccountsPerIp": 1, "trackIpAddresses": true, "maxAccountsPerDevice": 1}, "regenerateAfterLogin": true, "rotateSecretInterval": 86400000}	security	2025-05-15 21:23:04.416	2025-05-16 07:12:14.69
54	user_active_session_24	{"sessionId": "1L9S0W9lYqPF3ztP5QUkW_S0du7ptNt1", "updatedAt": "2025-05-17T23:15:00.690Z"}	session-management	2025-05-17 23:12:27.123	2025-05-17 23:15:00.69
58	ip-region-::ffff:97.115.191.81	{"region": "GLOBAL", "country": "US", "currency": "USD", "countryName": "United States"}	ip-geolocation	2025-05-17 19:15:08.879165	2025-05-17 19:15:08.879165
118	user_active_session_31	{"sessionId": "UZINnHLBf7AVNDrI7MIHfs0PKYURcf7g", "updatedAt": "2025-05-23T08:38:31.900Z"}	session-management	2025-05-23 08:38:31.9	2025-05-23 08:38:31.9
7	password_policy	{"minLength": 8, "requireNumbers": true, "requireLowercase": true, "requireUppercase": true, "maxFailedAttempts": 5, "preventReuseCount": 3, "passwordExpiryDays": 60, "requireSpecialChars": true, "lockoutDurationMinutes": 60}	security	2025-05-15 21:23:04.415	2025-05-29 03:22:09.664
85	ip-region-::ffff:89.116.21.215	{"region": "INDIA", "country": "IN", "currency": "INR", "countryName": "India"}	ip-geolocation	2025-05-19 18:57:32.219928	2025-05-19 18:57:32.219928
87	ip-region-103.168.202.2	{"region": "INDIA", "country": "IN", "currency": "INR", "countryName": "India"}	ip-geolocation	2025-05-19 19:04:04.044556	2025-05-19 19:04:04.044556
86	user_active_session_29	{"sessionId": "j5IjglutqjjaYfZTDb_uJu-Y-vojLqI0", "updatedAt": "2025-05-29T04:23:35.387Z"}	session-management	2025-05-19 22:59:25.884	2025-05-29 04:23:35.387
43	user_active_session_13	{"sessionId": "g7kVwAEUSudhpMBTrlWJvJRZhGWf04o-", "updatedAt": "2025-05-17T18:25:05.589Z"}	session-management	2025-05-17 18:17:29.225	2025-05-17 18:25:05.589
88	ip-region-89.116.21.215	{"region": "INDIA", "country": "IN", "currency": "INR", "countryName": "India"}	ip-geolocation	2025-05-19 19:04:26.34959	2025-05-19 19:04:26.34959
69	user_active_session_25	{"sessionId": "pe1t2tUo0rsrVJi3SBi81nqTyHrt2_u3", "updatedAt": "2025-05-19T03:33:15.774Z"}	session-management	2025-05-19 03:33:15.774	2025-05-19 03:33:15.774
112	user_active_session_30	{"sessionId": "WBWyaIkSPV9q8FscESbWWCr78QU_ANE1", "updatedAt": "2025-05-23T06:09:57.287Z"}	session-management	2025-05-23 06:09:57.284	2025-05-23 06:09:57.287
72	user_active_session_26	{"sessionId": "XnKQlrqDoAhHZNGSEIAt-8tvD4E0UMzn", "updatedAt": "2025-05-19T03:39:29.930Z"}	session-management	2025-05-19 03:39:29.93	2025-05-19 03:39:29.93
92	subscription_downgrade_1_1747770776026	{"userId": 1, "newPrice": 899, "toPlanId": 4, "timestamp": "2025-05-20T19:52:56.026Z", "fromPlanId": 5, "currentPrice": 1799, "isActualDowngrade": true, "isFreemiumDowngrade": false}	subscription_events	2025-05-20 15:52:56.026334	2025-05-20 15:52:56.026334
115	ip-region-::ffff:75.128.43.158	{"region": "GLOBAL", "source": "geojs", "country": "US", "currency": "USD", "countryName": "United States"}	ip-geolocation	2025-05-23 04:32:12.477926	2025-05-23 04:32:12.477926
141	user_active_session_32	{"sessionId": "ij70yqrXMRDLI8pj3BPGWaQdRX5gn4-8", "updatedAt": "2025-05-29T20:41:52.176Z"}	session-management	2025-05-29 20:41:52.176	2025-05-29 20:41:52.176
152	user_active_session_18	{"sessionId": "b08YvJRxivo3MOmFaledOedP-kyYIiS0", "updatedAt": "2025-06-04T07:14:44.923Z"}	session-management	2025-06-04 07:14:44.923	2025-06-04 07:14:44.923
9	user_active_session_1	{"sessionId": "CDSgiNfYtQuMU0SfJXm82BEzvZYkeuLn", "updatedAt": "2025-06-04T08:31:59.956Z"}	session-management	2025-05-16 07:25:52.096	2025-06-04 08:31:59.956
\.


--
-- Data for Name: blog_categories; Type: TABLE DATA; Schema: public; Owner: raja
--

COPY public.blog_categories (id, name, slug, description, parent_id, seo_title, seo_description, seo_keywords, is_active, sort_order, post_count, created_at, updated_at) FROM stdin;
1	Career Advice	career-advice	Tips and guidance for career development and job searching	\N	Career Advice - Resume Building Tips	Get expert career advice and tips for building better resumes and landing your dream job	\N	t	1	0	2025-05-29 19:17:07.278471	2025-05-29 19:17:07.278471
2	Resume Tips	resume-tips	Best practices for creating effective resumes	\N	Resume Tips - How to Write Better Resumes	Learn how to write compelling resumes that get noticed by employers and ATS systems	\N	t	2	0	2025-05-29 19:17:07.278471	2025-05-29 19:17:07.278471
3	Interview Guide	interview-guide	Guides and tips for successful job interviews	\N	Interview Guide - Ace Your Next Job Interview	Master the art of job interviews with our comprehensive guides and expert tips	\N	t	3	0	2025-05-29 19:17:07.278471	2025-05-29 19:17:07.278471
4	Industry News	industry-news	Latest news and trends in recruitment and career development	\N	Industry News - Latest Career and Job Market Trends	Stay updated with the latest trends in the job market and recruitment industry	\N	t	4	0	2025-05-29 19:17:07.278471	2025-05-29 19:17:07.278471
5	AI & Technology	ai-technology	How AI and technology are changing the job market	\N	AI & Technology in Career Development	Discover how AI and technology are transforming resumes, job applications, and career development	\N	t	5	0	2025-05-29 19:17:07.278471	2025-05-29 19:17:07.278471
6	Cover Letter	cover-letter	Tips & Tricks to write the cover letter	\N	\N	\N	\N	t	6	0	2025-05-29 19:30:39.509844	2025-05-29 23:30:39.509
\.


--
-- Data for Name: blog_comments; Type: TABLE DATA; Schema: public; Owner: raja
--

COPY public.blog_comments (id, post_id, author_name, author_email, author_website, content, parent_id, is_approved, is_spam, ip_address, user_agent, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: blog_media; Type: TABLE DATA; Schema: public; Owner: raja
--

COPY public.blog_media (id, filename, original_name, mime_type, size, width, height, url, alt, caption, type, uploaded_by, is_used, created_at, updated_at) FROM stdin;
1	1748564557926-770481673.jpg	15185972_5577268.jpg	image/jpeg	584697	\N	\N	/uploads/blog/images/1748564557926-770481673.jpg	\N	\N	image	1	f	2025-05-29 20:22:37.930325	2025-05-30 00:22:37.929
2	1748565813523-702132621.jpg	15185972_5577268.jpg	image/jpeg	584697	\N	\N	/uploads/blog/images/1748565813523-702132621.jpg	\N	\N	image	1	f	2025-05-29 20:43:33.530285	2025-05-30 00:43:33.529
3	1748565984426-139369236.png	Asset 1.png	image/png	41287	\N	\N	/uploads/blog/images/1748565984426-139369236.png	\N	\N	image	1	f	2025-05-29 20:46:24.427452	2025-05-30 00:46:24.426
4	1748566013175-997803144.png	Asset 1.png	image/png	41287	\N	\N	/uploads/blog/images/1748566013175-997803144.png	\N	\N	image	1	f	2025-05-29 20:46:53.180179	2025-05-30 00:46:53.177
5	1748566128054-631493492.png	Asset 1.png	image/png	41287	\N	\N	/uploads/blog/images/1748566128054-631493492.png	\N	\N	image	1	f	2025-05-29 20:48:48.056939	2025-05-30 00:48:48.056
6	1748566337395-666460857.png	Asset 1.png	image/png	41287	\N	\N	/uploads/blog/images/1748566337395-666460857.png	\N	\N	image	1	f	2025-05-29 20:52:17.397926	2025-05-30 00:52:17.397
7	1748566521279-602545166.png	Asset 1.png	image/png	41287	\N	\N	/uploads/blog/images/1748566521279-602545166.png	\N	\N	image	1	f	2025-05-29 20:55:21.282007	2025-05-30 00:55:21.281
8	1748566537344-5891584.png	Asset 1.png	image/png	41287	\N	\N	/uploads/blog/images/1748566537344-5891584.png	\N	\N	image	1	f	2025-05-29 20:55:37.346216	2025-05-30 00:55:37.345
9	1748566643159-596933691.png	Asset 1.png	image/png	41287	\N	\N	/uploads/blog/images/1748566643159-596933691.png	\N	\N	image	1	f	2025-05-29 20:57:23.16295	2025-05-30 00:57:23.162
\.


--
-- Data for Name: blog_post_tags; Type: TABLE DATA; Schema: public; Owner: raja
--

COPY public.blog_post_tags (id, post_id, tag_id, created_at) FROM stdin;
8	1	1	2025-05-29 21:05:23.729313
9	1	2	2025-05-29 21:05:23.729313
10	1	5	2025-05-29 21:05:23.729313
11	1	6	2025-05-29 21:05:23.729313
12	1	9	2025-05-29 21:05:23.729313
13	2	11	2025-05-29 21:57:04.484276
14	2	1	2025-05-29 21:57:04.484276
15	2	4	2025-05-29 21:57:04.484276
19	3	2	2025-05-30 00:38:31.684297
20	3	8	2025-05-30 00:38:31.684297
21	3	9	2025-05-30 00:38:31.684297
27	6	4	2025-06-04 09:54:20.696641
28	5	4	2025-06-04 18:20:44.469425
29	4	2	2025-06-04 18:21:03.434388
30	4	4	2025-06-04 18:21:03.434388
\.


--
-- Data for Name: blog_posts; Type: TABLE DATA; Schema: public; Owner: raja
--

COPY public.blog_posts (id, title, slug, excerpt, content, featured_image, featured_image_alt, status, seo_title, seo_description, seo_keywords, meta_tags, canonical_url, allow_comments, is_featured, is_sticky, category_id, author_id, published_at, scheduled_at, view_count, read_time, table_of_contents, custom_fields, created_at, updated_at) FROM stdin;
1	How AI is Revolutionizing Resume Writing: 5 Ways Smart Technology Helps You Land Your Dream Job	ai-revolutionizing-resume-writing-smart-technology	Discover how artificial intelligence is transforming the way job seekers create resumes. Learn about 5 powerful AI features that can help you craft ATS-optimized, compelling resumes that get noticed by recruiters and land interviews.	<p>How AI is Revolutionizing Resume Writing: 5 Ways Smart Technology Helps You Land Your Dream Job</p><p>The job market has never been more competitive. With hundreds of applications flooding in for every position, how do you make sure your resume stands out? The answer lies in the power of artificial intelligence.</p><p>The Traditional Resume Challenge</p><p>Creating an effective resume used to mean hours of formatting, guessing at keywords, and hoping your document would make it past Applicant Tracking Systems (ATS). Job seekers would spend countless hours tweaking their resumes, often without knowing if their efforts would pay off.</p><p>Enter AI-Powered Resume Building</p><p>Today's smart resume platforms are changing the game entirely. Here are 5 ways AI technology is revolutionizing how we approach resume writing:</p><p>1. <strong>Intelligent Keyword Optimization</strong></p><p>AI analyzes job descriptions in real-time and suggests the exact keywords and phrases that recruiters are looking for. No more guessing—the technology tells you precisely what to include to match the position.</p><p>2. <strong>ATS Compatibility Guaranteed</strong></p><p>Modern AI tools can predict how Applicant Tracking Systems will parse your resume. They ensure proper formatting, section organization, and keyword density to maximize your chances of passing initial screening.</p><p>3. <strong>Dynamic Content Suggestions</strong></p><p>Based on your industry and role, AI can suggest powerful action verbs, quantified achievements, and compelling descriptions that make your experience shine.</p><p>4. <strong>Real-Time Scoring and Feedback</strong></p><p>Get instant feedback on your resume's effectiveness with AI-powered scoring systems. Know exactly where you stand before hitting "submit" on that job application.</p><p>5. <strong>Personalized Templates and Formatting</strong></p><p>AI can recommend the best template styles, layouts, and formatting choices based on your industry, experience level, and target roles.</p><p>The Results Speak for Themselves</p><p>Job seekers using AI-powered resume tools report:</p><p>- 40% more interview callbacks</p><p>- 60% reduction in time spent on resume creation</p><p>- 85% improvement in ATS compatibility scores</p><p>- Significantly higher confidence in their applications</p><p>Getting Started with AI Resume Building</p><p>The beauty of modern AI resume tools is their simplicity. Most platforms guide you through an intuitive process:</p><p>1. <strong>Input your basic information</strong></p><p>2. <strong>Select your target role and industry</strong></p><p>3. <strong>Let AI analyze and optimize your content</strong></p><p>4. <strong>Review suggestions and make personalized adjustments</strong></p><p>5. <strong>Download your professionally optimized resume</strong></p><p>The Future is Here</p><p>As AI technology continues to evolve, we can expect even more sophisticated features like predictive career pathing, salary optimization insights, and real-time job market analysis.</p><p>The question isn't whether you should use AI for your resume—it's whether you can afford not to in today's competitive landscape.</p><p>---</p><p><em>Ready to experience the power of AI-driven resume building? Start creating your optimized resume today and join thousands of job seekers who've already discovered the advantage of smart technology.</em></p>	/images/blog/blog-1748567120762-57782661.png	Test featured image	published	 How AI Revolutionizes Resume Writing: 5 Smart Tips 	Discover how AI technology transforms resume writing. Learn 5 powerful ways AI helps create ATS-optimized resumes that get more interviews and job offers	AI resume writing, artificial intelligence resume, ATS optimization, smart resume builder, AI job search tools, resume technology, automated resume optimization, AI career tools	{}	\N	t	t	f	5	1	2025-05-30 01:05:23.7	\N	46	3	\N	{}	2025-05-29 20:28:00.472279	2025-05-30 01:05:23.718
5	How to Answer “Tell Me About Yourself” in an Interview (With Examples and Tips)	how-to-answer-tell-me-about-yourself-in-an-interview-with-examples-and-tips	Master the “Tell me about yourself” interview question with confidence. Learn what to say, what to avoid, and how to impress any hiring manager.	<p>One of the most commonly asked job interview questions is also one of the most deceptively difficult: “<strong>Tell me about yourself.</strong>”  It seems like a casual, open-ended prompt, but how you answer can shape the entire tone of the interview. Hiring managers use this question to assess your communication skills, confidence, and ability to connect your background to the role. </p><p><span style="color: rgb(0, 0, 0)">In this guide, we’ll walk you through how to answer “tell me about yourself” professionally and effectively using expert-backed strategies, example answers, and insights from&nbsp;</span><strong>atScribe</strong><span style="color: rgb(0, 0, 0)">, a leading AI-powered platform that helps candidates perfect their resumes, cover letters, and interview readiness.</span></p><h3>Why Employers Ask “Tell Me About Yourself”</h3><p>Before jumping into how to answer, it’s important to understand why interviewers ask this question. It’s not just small talk. This interview question serves several purposes:</p><ul><li><p>It helps the interviewer gauge how well you can summarize and communicate key points.</p></li><li><p>It offers insight into your professional identity and confidence.</p></li><li><p>It opens the door for follow-up questions based on what you choose to share.</p></li><li><p>It reveals whether you understand what the role requires and how your background fits.</p></li></ul><p>When answering “tell me about yourself,” you’re setting the tone for the rest of the conversation. A thoughtful, focused response creates momentum and helps position you as the ideal candidate.</p><h3>The Best Way to Answer “Tell Me About Yourself”</h3><p>To craft the ideal response, use the&nbsp;<strong>Present–Past–Future</strong>&nbsp;structure. This widely recommended approach ensures clarity, relevance, and flow.</p><h4>1. Present: Who You Are Today</h4><p>Begin with your current role or what you’re doing now professionally. Focus on your responsibilities, areas of expertise, and recent accomplishments.</p><p><strong>Example:</strong><br>“I’m currently a project coordinator at a healthcare technology company, where I lead cross-functional initiatives to improve clinical data systems and reporting accuracy.”</p><h4>2. Past: How You Got Here</h4><p>Briefly describe your educational background or previous experiences that led to your current role. This is your chance to highlight relevant achievements or transitions.</p><p><strong>Example:</strong><br>“I started my career as a research assistant while completing my master’s in health informatics. That experience sparked my interest in data-driven solutions, which led me to roles in clinical analytics and patient engagement technologies.”</p><h4>3. Future: What You’re Looking For</h4><p>Conclude with a forward-looking statement about your career goals and how the role you’re interviewing for aligns with them.</p><p><strong>Example:</strong><br>“I’m now looking to join a company where I can contribute to large-scale health innovation projects and take on more strategic leadership responsibilities. That’s why I’m excited about this opportunity.”</p><p><span style="color: rgb(0, 0, 0)">With&nbsp;</span><strong>atScribe</strong><span style="color: rgb(0, 0, 0)">, users can rehearse this structure in real-time, using AI-powered tools to refine and personalize their answers based on industry and role.</span></p><h3>Sample Answers for “Tell Me About Yourself”</h3><h4>For Recent Graduates:</h4><p>“I recently graduated with a degree in computer science and completed a data science internship at a health startup, where I worked on predictive modeling for patient readmission. I’ve developed strong skills in Python, SQL, and cloud computing, and I’m now looking for a full-time opportunity to apply those skills in a company focused on digital health transformation.”</p><h4>For Career Changers:</h4><p>“After several years in retail management, where I developed strong leadership and operational skills, I decided to pursue my passion for user-centered design. I recently completed a UX design bootcamp and worked on projects involving healthcare mobile apps. I’m now looking to transition into a full-time UX role where I can contribute to improving patient experiences.”</p><h4>For Experienced Professionals:</h4><p>“With over 8 years of experience in data analytics, I’ve led multiple enterprise-level initiatives in both the finance and healthcare sectors. Most recently, I’ve been leading data governance efforts for a hospital network, improving compliance and reporting standards. I’m now seeking a role that combines my technical expertise with leadership in a more agile, mission-driven environment.”</p><p><span style="color: rgb(0, 0, 0)">All these responses were designed using the same foundational logic that&nbsp;</span><strong>atScribe</strong><span style="color: rgb(0, 0, 0)">&nbsp;applies to crafting strong, personalized professional narratives.</span></p><h3>Common Mistakes to Avoid</h3><p>Even when answering a simple interview question like “tell me about yourself,” it’s easy to make missteps. Here are the most frequent ones to avoid:</p><p><strong>1. Giving a Personal Life Story:</strong><br>Stick to professional details. Avoid childhood memories, personal opinions, or unrelated hobbies.</p><p><strong>2. Reciting Your Resume Line-by-Line:</strong><br>Your resume already covers the facts. Your answer should add context, not repetition.</p><p><strong>3. Being Too Vague or Generic:</strong><br>Tailor your answer to the specific role. Mention the company or its mission if possible.</p><p><strong>4. Rambling or Going Off-Topic:</strong><br>Keep your response under two minutes. Focus on what’s relevant and impactful.</p><p><strong>5. Sounding Rehearsed or Robotic:</strong><br>Practice enough to sound polished but not memorized. Maintain a natural tone.</p><p>Tools like&nbsp;<strong>atScribe</strong>&nbsp;can help you draft, edit, and rehearse your response to ensure clarity and confidence.</p><h3>How to Customize Your Answer for Different Roles</h3><p>Your answer to “tell me about yourself” should vary slightly depending on the role or industry. Here’s how to tailor it:</p><ul><li><p><strong>For technical roles:</strong>&nbsp;Highlight your programming languages, tools, or frameworks used.</p></li><li><p><strong>For leadership positions:</strong>&nbsp;Emphasize team management, decision-making, and strategic contributions.</p></li><li><p><strong>For creative positions:</strong>&nbsp;Focus on storytelling, ideation, and user impact.</p></li><li><p><strong>For entry-level jobs:</strong>&nbsp;Lean on academic achievements, internships, and transferable skills.</p></li></ul><p>Always study the job description beforehand so you can match your experience with their needs.</p><h3>Using atScribe to Perfect Your Interview Pitch</h3><p><strong>atScribe</strong>&nbsp;helps job seekers elevate their professional presentation through advanced resume analysis, cover letter generation, and interview coaching.</p><p>When it comes to answering “tell me about yourself,” the platform offers:</p><ul><li><p>Custom answer templates based on industry and role</p></li><li><p>AI critiques of your speaking style and content</p></li><li><p>Suggestions to improve tone, clarity, and structure</p></li><li><p>Real-time practice scenarios with simulated recruiters</p></li></ul><p>With&nbsp;<strong>atScribe</strong>, candidates not only learn how to answer “tell me about yourself” but also gain the confidence to deliver it fluently under pressure.</p><h3>Final Tips for a Strong Introduction</h3><ul><li><p><strong>Know your audience:</strong>&nbsp;Research the company and adjust your tone accordingly.</p></li><li><p><strong>Prepare talking points:</strong>&nbsp;Don’t script word-for-word, but plan key ideas.</p></li><li><p><strong>Practice with a friend or mentor:</strong>&nbsp;Feedback will help you fine-tune your delivery.</p></li><li><p><strong>Record yourself:</strong>&nbsp;Watching your own delivery can help eliminate filler words or awkward phrasing.</p></li></ul><p>Mastering how to answer “tell me about yourself” will elevate your interview performance and build confidence at every stage of your job search.</p><h3>Conclusion</h3><p>Knowing how to answer the “tell me about yourself” interview question is crucial for setting the right tone and making a great first impression. Use the present–past–future format to structure your response, tailor it to each role, and focus on what makes you a strong fit.</p><p>This one question opens the door to showcase your communication skills, highlight key experiences, and show your enthusiasm for the role. With preparation and strategy, your answer to “tell me about yourself” can be the beginning of your next big career move.</p><hr>	/images/blog/blog-1749061242549-205843024.png	\N	published	How to Answer “Tell Me About Yourself” in an Interview	Learn how to answer the “Tell me about yourself” interview question with confidence. Includes examples, structure, and tips to stand out in job interview	tell me about yourself, how to answer tell me about yourself, interview question tell me about yourself, self introduction for interview, job interview tips, interview answers, tell me about yourself sample answer, answering interview questions	{}	\N	t	t	t	3	1	2025-06-04 18:20:44.431	\N	12	6	\N	{}	2025-06-04 09:02:03.995558	2025-06-04 18:20:44.459
2	How to Explain an Employment Gap on a Resume in 2025 (with Examples)	how-to-explain-employment-gap-in-resume	Don't let resume gaps derail your career. Learn how to explain employment breaks professionally and turn them into strengths.	<h3>Employment Gaps Aren’t Career Killers—If You Handle Them Right</h3><p>In today’s dynamic job market, having a gap in your resume is more common than ever. Whether you took a break for personal reasons, health, caregiving, or career change, how you present that time off can make or break your chances of landing an interview.</p><p>At&nbsp;<strong>atScribe</strong>, we believe every story deserves a second act—and your resume should reflect that.</p><h3>Why Employment Gaps Matter</h3><p>Recruiters want consistency and commitment but they also understand life happens. A gap in your employment history may raise questions, but it’s also an opportunity to show growth, resilience, and how you’ve stayed professionally engaged.</p><h3>How to Positively Frame a Resume Gap</h3><p>Use these smart, strategic approaches to turn resume gaps into assets:</p><h4>1. Be Honest, Brief, and Upfront</h4><p>Avoid vague explanations. A short statement like “Took time off for family care” or “Career sabbatical for professional development” provides clarity without oversharing.</p><h4>2. Focus on What You Gained</h4><p>Did you volunteer, complete certifications, or work on side projects? List them. Emphasize transferable skills gained during your time away—like leadership, adaptability, or technical proficiencies.</p><h4>3. Choose the Right Resume Format</h4><p>Use a&nbsp;<strong>functional resume format</strong>&nbsp;to spotlight skills over timelines. This format is ideal when you have extended or multiple gaps.</p><h4>4. Include Gaps in Your Summary</h4><p>If the gap is recent or significant, briefly mention it in your resume summary. Show what you’ve done during the break and how it makes you a stronger candidate.</p><h3>Common Reasons for Resume Gaps and Sample Phrases</h3><p>Here are real-world explanations you can tailor:</p><ul><li><p><strong>Health Recovery</strong>:<br>“Took time to fully recover from a medical issue—now ready to contribute with renewed energy.”</p></li><li><p><strong>Family Responsibilities</strong>:<br>“Provided full-time care for a family member, developing organizational and multi-tasking skills.”</p></li><li><p><strong>Career Transition</strong>:<br>“Completed online certifications to pivot from teaching to UX design.”</p></li><li><p><strong>Burnout/Personal Growth</strong>:<br>“Used the time to recharge and pursue personal development through volunteering and self-study.”</p></li><li><p><strong>Layoffs</strong>:<br>“Position eliminated during downsizing. Focused on upskilling in digital marketing during transition.”</p></li></ul><h3>Where to Mention Employment Gaps</h3><ul><li><p><strong>Work Experience Section</strong>: Include a brief role like “Sabbatical” or “Family Caregiver” with dates and key accomplishments.</p></li><li><p><strong>Resume Summary</strong>: Especially useful for recent or extended gaps.</p></li><li><p><strong>Cover Letter</strong>: Best place to tell your story with context and confidence.</p></li></ul><h3>Tips to Minimize the Impact of Employment Gaps</h3><p>✔ Emphasize skills, not dates<br>✔ Highlight any continued learning or freelance work<br>✔ Be confident and honest<br>✔ Show that the gap was a conscious and productive period</p><h3>Resume Example With Employment Gap (Functional Format)</h3><p><strong>Summary</strong><br>Experienced Financial Analyst with a strong background in budgeting, forecasting, and risk analysis. Recently completed advanced training in financial modeling and data analytics after a personal sabbatical. Ready to bring strategic insights and data-driven thinking to a dynamic organization.</p><p><strong>Key Skills</strong></p><ul><li><p>Financial Planning</p></li><li><p>Data Analytics</p></li><li><p>Excel &amp; Power BI</p></li><li><p>Strategic Forecasting</p></li></ul><p><strong>Experience</strong><br><strong>Sabbatical | Personal Development</strong><br>2022 – 2023<br>Completed Coursera certifications in financial modeling and volunteered as a budgeting advisor for a local nonprofit.</p><p><strong>Financial Analyst | ABC Corporation</strong><br>2018 – 2021</p><ul><li><p>Led quarterly forecasting with 98% accuracy</p></li><li><p>Managed budgets exceeding $5M annually</p></li><li><p>Identified $300K in cost savings through operational analysis</p></li></ul><h3>Final Thoughts: Gaps Don’t Define You—Your Growth Does</h3><p>Resume gaps are simply part of the journey. Whether short or long, what matters is how you’ve grown and how you communicate it.</p><p>At&nbsp;<strong>atScribe</strong>, we make your resume future-ready: AI-powered, ATS-friendly, and gap-smart. Ready to land interviews with confidence?</p>	/images/blog/blog-1748570204480-477356846.png	Explain an Employment Gap on a Resume in 2025 	published	How to Explain Employment Gaps on Your Resume	Learn how to explain employment gaps on your resume with real examples. Use these tips to address career breaks professionally in 2025.	employment gap resume, how to explain employment gap, resume gap explanation, ATS resume tips, resume for career break	{}	\N	t	f	t	2	1	2025-05-30 01:57:04.478	\N	7	3	\N	{}	2025-05-29 21:57:04.479651	2025-05-30 01:57:04.478
4	What to Do If You Don’t Have Any Job References	what-to-do-if-you-dont-have-any-job-references	Worried you don’t have job references? Whether you're a recent grad or switching careers, here’s how to explain it, who to list instead, and how to impress recruiters.	<p>So, your resume and cover letter are polished. You've nailed the interview, and you're feeling hopeful. But suddenly—you're asked for references, and your mind goes blank. What if you don’t have any?</p><p>You're not alone. Whether you're a recent graduate, shifting careers, re-entering the workforce, or new to a country or industry, it's common to lack traditional professional references.</p><p>But don’t worry you’re not out of options. This guide will show you:</p><ul><li><p>Why references matter</p></li><li><p>Common reasons candidates don’t have them</p></li><li><p>Who you&nbsp;<em>can</em>&nbsp;ask</p></li><li><p>How to explain the situation confidently</p></li><li><p>Tips to strengthen your reference game without a traditional work history</p></li></ul><h3>Why Do Employers Ask for References?</h3><p>References validate your experience, personality, and work ethic. They’re not just a formality—they help employers feel confident that hiring you is the right decision.</p><p>There are&nbsp;<strong>two types of references</strong>:</p><ul><li><p><strong>Professional references:</strong>&nbsp;past managers, professors, or coworkers who can speak to your work performance and skills.</p></li><li><p><strong>Personal references:</strong>&nbsp;mentors, community leaders, or peers who know your character and reliability.</p></li></ul><p>Both can be valuable—especially when you're early in your career.</p><h3>Why You Might Not Have Job References</h3><p>Here are some completely valid reasons:</p><ul><li><p>You're applying for your first job</p></li><li><p>You’re a recent graduate or international student</p></li><li><p>You’ve been self-employed or freelancing</p></li><li><p>You’re returning after a career break</p></li><li><p>You’ve changed industries</p></li><li><p>Language or location barriers make old references unavailable</p></li></ul><p>Recruiters understand these situations. It’s all about how you present yourself and who you&nbsp;<em>do</em>&nbsp;bring to the table.</p><h3>Who Can You Ask for a Reference Instead?</h3><p>If you don’t have a former manager to list, consider these:</p><ol><li><p><strong>College or High School Professors</strong><br>Especially relevant if you worked with them on a project, thesis, or served as a TA.</p></li><li><p><strong>Volunteer Coordinators or Community Leaders</strong><br>They can speak to your leadership, teamwork, and dedication.</p></li><li><p><strong>Mentors or Coaches</strong><br>Career or personal development mentors who’ve guided you through growth.</p></li><li><p><strong>Former Classmates or Project Teammates</strong><br>They can share insight on your collaboration and communication skills.</p></li><li><p><strong>Family or Friends You’ve Worked For</strong><br>Only include if they can honestly discuss your contributions in a work-like context.</p></li></ol><h3>How to Ask for a Reference (The Right Way)</h3><ol><li><p><strong>Always ask for permission.</strong><br>Don’t surprise someone with a call from a recruiter.</p></li><li><p><strong>Give them context.</strong><br>Tell them about the job and what you’d like them to emphasize.</p></li><li><p><strong>Double-check their contact details.</strong><br>Outdated numbers or emails can hold up the process.</p></li><li><p><strong>Evaluate their enthusiasm.</strong><br>If they’re hesitant or forgetful, consider someone else.</p></li></ol><h3>No Reference? Try This Instead</h3><p>If you&nbsp;<em>still</em>&nbsp;can’t find three solid references:</p><ul><li><p><strong>Use a character reference</strong>&nbsp;from someone who can speak to your work ethic.</p></li><li><p><strong>Ask for a written recommendation</strong>&nbsp;instead of a call-based reference.</p></li><li><p><strong>Include a portfolio or work samples</strong>&nbsp;to showcase your capabilities.</p></li><li><p><strong>Be honest in your communication.</strong>&nbsp;Transparency builds trust.</p></li></ul><h3>Sample Email to Explain Lack of References</h3><blockquote><p><strong>Subject:</strong>&nbsp;Reference Availability for [Your Name] – [Job Title] Application</p><p>Dear [Hiring Manager’s Name],</p><p>Thank you for the opportunity to interview for the [Job Title] position. I'm excited about the role and confident that my background aligns with your needs.</p><p>I want to be transparent: I don’t have recent professional references due to [reason—e.g., career change, academic background, freelance work]. However, I’ve included references who can speak to my character, work ethic, and transferable skills.</p><p>These include a university mentor, a volunteer supervisor, and a peer from a collaborative project. I’ve informed them and they are happy to speak with you.</p><p>Please let me know if you'd prefer written recommendations or need additional information. I appreciate your understanding.</p><p>Best regards,<br>[Your Full Name]<br>[Phone] | [Email]</p></blockquote><h3>📌 Final Takeaways</h3><ul><li><p><strong>Don’t panic</strong>&nbsp;if you lack job references—most employers are more flexible than you think.</p></li><li><p><strong>Be strategic</strong>&nbsp;and list mentors, professors, or community leaders.</p></li><li><p><strong>Be honest and proactive</strong>&nbsp;in how you communicate your situation.</p></li><li><p><strong>Prepare your references</strong>&nbsp;and give them the right context.</p></li><li><p><strong>Ask for letters</strong>&nbsp;if verbal references aren’t possible.</p></li></ul><p>Remember, every professional started somewhere. The right employer will see your potential even without a stacked reference list.</p>	/images/blog/blog-1749061258548-232558680.png	\N	published	What to Do If You Don’t Have Any Job References Guide + Tips	No job references? Learn who to ask, how to explain your situation, and how to impress employers even without traditional references.	no job references, what to do without job references, who to list as job reference, how to get job references, lack of references for job, reference letter alternatives, professional reference examples, personal references for job, entry level job references	{}	\N	t	f	t	3	1	2025-06-04 18:21:03.413	\N	16	3	\N	{}	2025-06-04 08:48:32.538047	2025-06-04 18:21:03.428
3	Navigating Your Career Path in 2025: Strategies for Success	navigating-career-path-2025	Discover effective career navigation strategies for 2025, from leveraging AI to building soft skills and expanding your network for a future-proof professional journey.  	<h2>Navigating Your Career in 2025: </h2><p>A New Era of Work The nature of work has changed. As we move deeper into 2025, career paths are no longer linear, job roles evolve faster than ever, and technology continues to redefine how we work. With artificial intelligence, remote collaboration, and shifting industry landscapes shaping modern careers, professionals need to be more adaptable and strategic in planning their futures.  </p><p>At atScribe, we’re committed to helping professionals thrive not just survive in this fast-paced world of work. Whether you're just entering the workforce, making a mid-career switch, or preparing for leadership, these are the most impactful ways to navigate your career path in 2025.</p><h3><strong>1. Embrace the Power of Artificial Intelligence</strong></h3><p>AI is now deeply embedded into the hiring process, workplace tools, and even strategic decision-making. Far from being a threat, AI can be a powerful career asset if used wisely.</p><ul><li><p><strong>Automate the routine</strong>: Use tools like Notion AI, ChatGPT, or Grammarly to handle repetitive tasks, summarize reports, and write more effectively.</p></li><li><p><strong>Upskill with AI</strong>: Platforms like Coursera, edX, and LinkedIn Learning offer AI-focused courses—from prompt engineering to machine learning basics.</p></li><li><p><strong>Job search boost</strong>: Use AI-powered resume builders and job match tools to increase visibility and compatibility with Applicant Tracking Systems (ATS).</p></li></ul><blockquote><p>“To get ahead in your career, you need to work&nbsp;<em>with</em>&nbsp;AI, not against it,” says Noam Shazeer, co-founder of <a target="_blank" rel="noopener noreferrer nofollow" href="http://Character.AI">Character.AI.</a> </p></blockquote><h3><strong>2. Invest in Human Skills That AI Can’t Replace</strong></h3><p>While AI excels at data processing, the most valuable workplace traits in 2025 are still deeply human. According to a report from EY Global, soft skills are becoming more crucial than ever.</p><p><strong>Top human skills to develop:</strong></p><ul><li><p><strong>Adaptability</strong>: Thrive in fast-changing environments.</p></li><li><p><strong>Communication</strong>: Especially important in remote or hybrid workspaces.</p></li><li><p><strong>Emotional intelligence (EQ)</strong>: Understand and manage your own emotions and those of others.</p></li><li><p><strong>Critical thinking and creativity</strong>: Essential for problem-solving in AI-augmented roles.</p></li></ul><blockquote><p>“The future workforce must excel not only in tech but in empathy and leadership,” says Irmgard Naudin ten Cate, EY Global Talent leader.</p></blockquote><h3><strong>3. Take Networking Seriously—Online and Offline</strong></h3><p>Whether you're actively job-hunting or planning long-term growth, your network is your net worth. In a hybrid world, building and maintaining professional relationships across digital and real-world platforms is key.</p><p><strong>Practical networking strategies:</strong></p><ul><li><p>Use LinkedIn to share updates, comment thoughtfully, and send personalized connection requests.</p></li><li><p>Join online communities in your industry—Slack groups, Reddit, Discord, or Clubhouse.</p></li><li><p>Attend meetups, webinars, and conferences—then follow up with people you meet.</p></li><li><p>Offer value before asking for favors—share a useful article, provide feedback, or connect two peers.</p></li></ul><blockquote><p>Studies show that 85% of jobs are filled via networking, not job boards.</p></blockquote><h3><strong>4. Explore Before You Specialize</strong></h3><p>In 2025’s dynamic job market, early specialization might limit your long-term options. Companies are increasingly valuing&nbsp;<strong>versatility</strong>, especially across technology, communication, and strategic thinking.</p><p><strong>Why generalists are thriving:</strong></p><ul><li><p>You’re more adaptable to industry shifts.</p></li><li><p>You can transition between roles easily.</p></li><li><p>You develop cross-functional insights that specialists might miss.</p></li></ul><blockquote><p>“Specializing too early can be risky. Broader experience often leads to deeper expertise in the long run,” notes Philip Su, former engineer at Facebook and OpenAI.</p></blockquote><h3><strong>5. Reevaluate Your Career Goals Frequently</strong></h3><p>Gone are the days of 5- or 10-year plans. In 2025, career planning is a dynamic process that requires regular self-assessment.</p><p><strong>Questions to ask yourself every 6–12 months:</strong></p><ul><li><p>What skills have I acquired? What’s missing?</p></li><li><p>Am I growing in my current role?</p></li><li><p>Do I feel aligned with my values and goals?</p></li><li><p>What industries or roles are trending that match my skill set?</p></li></ul><h3><strong>6. Stay Open to Unconventional Opportunities</strong></h3><p>The gig economy, fractional work, freelance consulting, remote-first roles, and side hustles are not just trends—they’re career pillars in 2025.</p><p><strong>Think beyond full-time roles:</strong></p><ul><li><p>Freelance part-time in your area of expertise.</p></li><li><p>Launch a content platform or YouTube channel showcasing your knowledge.</p></li><li><p>Join a startup as a part-time contributor.</p></li><li><p>Volunteer in roles that build your leadership, tech, or fundraising skills.</p></li></ul><p>These experiences often help fill employment gaps and diversify your resume while expanding your skillset and network.</p><hr><h3><strong>Final Thoughts: Your Career Path Is a Journey, Not a Destination</strong></h3><p>In 2025, careers are fluid, multi-dimensional, and built through curiosity, flexibility, and intentional growth. Whether you’re leveraging AI, building relationships, or stepping into new fields, remember:</p><blockquote><p>“Your career is not defined by a title—it’s defined by how you grow.”</p></blockquote><p>At&nbsp;<strong>atScribe</strong>, our mission is to help you build a smarter, future-ready career—one decision at a time. If you're ready to update your resume, explore new paths, or boost your confidence for that next big opportunity, we’re here to help.</p><p></p>	/images/blog/blog-1748579895080-260806933.png	atscrbe career advance	published	Career Navigation Strategies for 2025	Explore practical career strategies for 2025, including AI adoption, soft skill development, and networking tips to help you succeed in the modern job market.	career strategies 2025, AI in career development, how to grow in your job, resume trends 2025, soft skills, job market future	{}	\N	t	t	t	1	1	2025-05-30 04:38:31.664	\N	12	4	\N	{}	2025-05-30 00:35:22.992902	2025-05-30 04:38:31.679
6	The Ultimate Guide to Answering "Why Are You Applying for This Position?" - 2025 Interview Tips and Career Advice	why-are-you-applying-for-this-position-interview-guide-2025	Master the most critical interview question with our comprehensive 2025 guide. Learn proven strategies, sample answers, and expert tips to answer "Why are you applying for this position?" effectively. Includes industry-specific responses, common mistakes to avoid, and advanced preparation techniques that will set you apart from other candidates in today's competitive job market.	<h2>Why This Interview Question Why Are You Applying for This Position Matters More Than Ever in 2025</h2><p>The job market landscape has transformed dramatically in 2025, with remote work becoming permanent, AI reshaping industries, and employers becoming increasingly selective about cultural fit. When interviewers ask the pivotal question "Why are you applying for this position?", they're not just making conversation—they're conducting a strategic assessment that can make or break your candidacy.</p><p>This classic interview question has evolved beyond a simple inquiry into your motivations. In today's competitive environment, your answer serves as a window into your professional maturity, research capabilities, and genuine commitment to the role. With the average job posting receiving over 250 applications in 2025, a compelling response to this question can be the differentiator that moves you from the "maybe" pile to the "must-hire" category.</p><h2>The Psychology Behind Why Employers Ask This Critical Interview Question</h2><p>Understanding the deeper motivations behind this question is crucial for crafting an effective response. When hiring managers pose this inquiry, they're simultaneously evaluating multiple dimensions of your candidacy:</p><h3>Assessing Your Research and Preparation Skills</h3><p>In 2025's information-rich environment, employers expect candidates to come prepared with detailed knowledge about the company, its recent developments, market position, and cultural values. Your response reveals whether you've invested time in understanding the organization beyond surface-level details.</p><h3>Evaluating Your Self-Awareness and Career Direction</h3><p>The best candidates can articulate not just what they want, but why they want it and how it aligns with their professional trajectory. This question tests your ability to connect your past experiences, current skills, and future aspirations in a coherent narrative.</p><h3>Measuring Genuine Interest vs. Desperation</h3><p>Hiring managers can quickly distinguish between candidates who are genuinely excited about the specific opportunity and those who are simply seeking any available position. Your enthusiasm level and specificity in your answer signal your true level of interest.</p><h3>Predicting Long-Term Retention</h3><p>With the cost of replacing an employee ranging from 50% to 200% of their annual salary, employers are increasingly focused on hiring candidates who will stay and grow with the company. Your response helps them gauge your likelihood of long-term commitment.</p><h2>Advanced Strategies for Answering "Why Do You Want This Job" in 2025</h2><h3>Strategy 1: The Three-Pillar Approach</h3><p>Structure your response around three key pillars: company alignment, role excitement, and growth opportunity. This framework ensures you cover all critical aspects while maintaining a logical flow.</p><p><strong>Company Alignment:</strong>&nbsp;Demonstrate specific knowledge about the company's mission, values, recent achievements, or market position. Reference concrete examples like recent product launches, company awards, or industry recognition.</p><p><strong>Role Excitement:</strong>&nbsp;Articulate what specifically excites you about the day-to-day responsibilities and how they align with your strengths and interests. Be specific about skills you'll utilize and challenges you're eager to tackle.</p><p><strong>Growth Opportunity:</strong>&nbsp;Explain how this position fits into your broader career trajectory and what you hope to learn or achieve in the role.</p><h3>Strategy 2: The Problem-Solution Framework</h3><p>Position yourself as the solution to a specific challenge or opportunity the company faces. This approach demonstrates strategic thinking and shows you understand the business context.</p><p>Research the company's current challenges, market position, or growth initiatives. Then explain how your background and skills position you to contribute meaningfully to addressing these areas.</p><h3>Strategy 3: The Value Proposition Method</h3><p>Frame your response around the unique value you bring to the organization. This approach shifts the focus from what you want to what you can offer, positioning you as an asset rather than just another candidate.</p><h2>Comprehensive Job Interview Questions and Answers Framework</h2><h3>For Entry-Level Positions</h3><p>When you're early in your career, focus on enthusiasm, learning potential, and transferable skills from education or internships.</p><p><strong>Sample Response:</strong>&nbsp;"I'm applying for this junior analyst position because your company's reputation for developing young talent aligns perfectly with my career goals. During my internship at [Previous Company], I discovered my passion for data analysis and saw firsthand how insights can drive business decisions. Your recent expansion into the Southeast market particularly excites me because I wrote my senior thesis on regional market penetration strategies. I'm eager to contribute my fresh perspective while learning from your experienced team. What training and development opportunities are available for new analysts?"</p><h3>For Mid-Level Professionals</h3><p>Emphasize your proven track record, specific skills, and how you can contribute immediately while continuing to grow.</p><p><strong>Sample Response:</strong>&nbsp;"After researching your company's innovative approach to sustainable manufacturing, I'm convinced this operations manager role represents the perfect intersection of my experience and values. In my current position, I've reduced waste by 35% and implemented lean manufacturing principles that saved $2.3 million annually. Your commitment to carbon neutrality by 2030 resonates with my personal mission to drive environmental responsibility in manufacturing. I'm particularly excited about the opportunity to lead the new facility expansion project, as I successfully managed a similar $15 million facility buildout in my previous role. How does this position contribute to the company's sustainability goals?"</p><h3>For Senior-Level Executives</h3><p>Focus on strategic vision, leadership experience, and how you can drive organizational transformation.</p><p><strong>Sample Response:</strong>&nbsp;"Having followed your company's remarkable transformation over the past three years, I'm drawn to this Chief Marketing Officer position because of the unique opportunity to lead marketing strategy during a pivotal growth phase. Your recent acquisition of [Company Name] creates fascinating possibilities for cross-platform synergies that align with my experience in post-merger marketing integration. At [Previous Company], I led a similar initiative that resulted in 40% revenue growth and 25% market share expansion. I'm particularly excited about your vision for international expansion, having successfully launched brands in 12 countries throughout my career. What are the biggest marketing challenges you anticipate as you scale globally?"</p><h2>Career Advice 2025: Tailoring Your Response to Industry Trends</h2><h3>Technology Sector Adaptations</h3><p>In tech interviews, emphasize your ability to adapt to rapid change, your passion for innovation, and your understanding of emerging technologies. Reference specific technologies, methodologies, or industry trends relevant to the role.</p><h3>Healthcare Industry Considerations</h3><p>Healthcare employers prioritize candidates who understand regulatory requirements, patient care quality, and the evolving landscape of healthcare delivery. Demonstrate your commitment to improving patient outcomes and your awareness of industry challenges.</p><h3>Financial Services Focus Areas</h3><p>Financial services companies value candidates who understand risk management, regulatory compliance, and customer trust. Highlight your attention to detail, ethical standards, and ability to navigate complex regulatory environments.</p><h3>Remote Work and Hybrid Considerations</h3><p>With remote and hybrid work becoming permanent fixtures, address how you thrive in flexible work environments and your strategies for maintaining productivity and collaboration across different work modalities.</p><h2>Advanced Research Techniques for 2025 Job Interviews</h2><h3>Digital Intelligence Gathering</h3><p>Utilize advanced research techniques to gather comprehensive information about the company and role:</p><p><strong>Social Media Analysis:</strong>&nbsp;Review the company's LinkedIn, Twitter, and industry-specific social platforms for recent updates, company culture insights, and employee experiences.</p><p><strong>Financial Research:</strong>&nbsp;For public companies, review recent quarterly reports, investor presentations, and analyst reports to understand business performance and strategic direction.</p><p><strong>Industry Context:</strong>&nbsp;Research industry trends, competitive landscape, and market challenges to demonstrate broader business acumen.</p><p><strong>Employee Insights:</strong>&nbsp;Use platforms like Glassdoor, Indeed, and Blind to understand employee experiences, company culture, and potential challenges.</p><h3>Networking and Informational Interviews</h3><p>Conduct informational interviews with current or former employees to gain insider perspectives on company culture, role expectations, and growth opportunities.</p><h2>Common Mistakes That Can Derail Your Interview</h2><h3>The Generic Response Trap</h3><p>Avoid responses that could apply to any company or role. Generic answers like "I want to work for a growing company" or "This seems like a great opportunity" demonstrate lack of preparation and genuine interest.</p><h3>The Salary and Benefits Focus</h3><p>While compensation is important, leading with salary, benefits, or work-life balance makes you appear primarily motivated by personal gain rather than contribution to the organization.</p><h3>The Negative Previous Experience Approach</h3><p>Avoid framing your interest in terms of what you want to escape from your current or previous role. Focus on what you're moving toward rather than what you're moving away from.</p><h3>The Overly Rehearsed Response</h3><p>While preparation is crucial, avoid responses that sound overly scripted or rehearsed. Maintain conversational tone and authentic enthusiasm.</p><h3>The Lack of Specific Examples</h3><p>Vague statements without concrete examples fail to demonstrate your capabilities or genuine interest. Always include specific examples that illustrate your points.</p><h2>Advanced Follow-Up Strategies</h2><h3>The Strategic Question Approach</h3><p>End your response with a thoughtful question that demonstrates deeper thinking about the role or company. This shows engagement and positions you as someone who thinks strategically about business challenges.</p><h3>The Mutual Benefit Framework</h3><p>Frame your interest in terms of mutual benefit—what you can contribute to the company and how the role supports your professional development.</p><h2>Industry-Specific Answer Variations</h2><h3>Startup Environment Responses</h3><p>"I'm drawn to this role because of the opportunity to have direct impact on product development and company growth. In startup environments, I thrive on wearing multiple hats and contributing to strategic decisions. Your company's innovative approach to [specific area] aligns with my experience in [relevant experience], and I'm excited about the possibility of helping scale the business from [current stage] to [next growth phase]."</p><h3>Corporate Environment Responses</h3><p>"Your company's established market position and commitment to professional development make this role particularly attractive. I'm impressed by [specific company achievement or initiative] and see this position as an opportunity to contribute to continued growth while developing my skills in [specific area]. My experience with [relevant experience] has prepared me for the structured environment and collaborative approach your team values."</p><h3>Non-Profit Sector Responses</h3><p>"The mission-driven nature of your organization resonates deeply with my personal values and career aspirations. Having volunteered with [relevant organization] and witnessed the impact of [specific cause], I'm passionate about contributing my [specific skills] to further your mission. This role represents the perfect opportunity to combine my professional expertise with my commitment to [specific cause or value]."</p><h2>The 2025 Remote Interview Advantage</h2><h3>Virtual Preparation Strategies</h3><p>Prepare for virtual interviews by testing technology, optimizing your environment, and practicing your response in a video format. Consider how your enthusiasm and engagement translate through a screen.</p><h3>Digital Portfolio Integration</h3><p>Enhance your response by referencing a digital portfolio, LinkedIn profile, or specific examples that can be easily shared during virtual interviews.</p><h2>Measuring Your Response Effectiveness</h2><h3>Interviewer Engagement Indicators</h3><p>Watch for positive body language, follow-up questions, and increased engagement from the interviewer as indicators that your response is resonating.</p><h3>Self-Assessment Criteria</h3><p>Evaluate your response based on specificity, authenticity, company knowledge demonstration, and alignment with role requirements.</p><h2>Conclusion: Mastering This Critical Interview Question</h2><p>Successfully answering "Why are you applying for this position?" requires thorough preparation, self-awareness, and genuine enthusiasm. In 2025's competitive job market, this question serves as a critical differentiator that can elevate your candidacy from ordinary to exceptional.</p><p>Remember that this question is ultimately about fit—fit between your skills and the role requirements, fit between your values and the company culture, and fit between your career aspirations and the growth opportunities available. By demonstrating this alignment through specific examples, thoughtful research, and authentic enthusiasm, you position yourself as not just a qualified candidate, but as the right candidate for the position.</p><p>The key to success lies in preparation, authenticity, and the ability to articulate your value proposition clearly and compellingly. With the strategies and frameworks outlined in this guide, you'll be well-equipped to tackle this fundamental interview question and advance your career in 2025 and beyond.</p>	/images/blog/blog-1749030856843-794671804.png	\N	published	Why Are You Applying? Interview Question Guide 2025	Master "Why are you applying for this position?" with proven 2025 interview tips, sample answers & expert career advice. Stand out from the competition!	interview question why are you applying for this position, 2025 interview tips, answering why do you want this job, job interview questions and answers, career advice 2025, interview preparation, job interview tips, interview questions, why this job interview question, interview answers examples, job search 2025, interview coaching, career development, professional interview advice, hiring manager questions	{}	\N	t	f	f	3	1	2025-06-04 09:54:20.632	\N	19	9	\N	{}	2025-06-04 09:20:48.938231	2025-06-04 09:54:20.684
\.


--
-- Data for Name: blog_settings; Type: TABLE DATA; Schema: public; Owner: raja
--

COPY public.blog_settings (id, blog_title, blog_description, blog_keywords, posts_per_page, allow_comments, moderate_comments, enable_rss, enable_sitemap, featured_image_required, enable_read_time, enable_table_of_contents, social_share_buttons, custom_css, custom_js, created_at, updated_at) FROM stdin;
1	Blog	Latest news and updates about resume building, career advice, and job applications	resume, career, job, AI, recruitment	10	t	t	t	t	f	t	t	["twitter", "facebook", "linkedin", "email"]	\N	\N	2025-05-29 19:17:07.277627	2025-05-29 19:17:07.277627
\.


--
-- Data for Name: blog_tags; Type: TABLE DATA; Schema: public; Owner: raja
--

COPY public.blog_tags (id, name, slug, description, color, post_count, created_at, updated_at) FROM stdin;
1	Resume Writing	resume-writing	Tips and techniques for writing effective resumes	#4f46e5	0	2025-05-29 19:17:07.279755	2025-05-29 19:17:07.279755
2	Career Development	career-development	Growth and advancement in your career	#10b981	0	2025-05-29 19:17:07.279755	2025-05-29 19:17:07.279755
3	Job Search	job-search	Strategies for finding and applying to jobs	#f97316	0	2025-05-29 19:17:07.279755	2025-05-29 19:17:07.279755
4	Interview Tips	interview-tips	How to succeed in job interviews	#ef4444	0	2025-05-29 19:17:07.279755	2025-05-29 19:17:07.279755
5	AI Tools	ai-tools	Artificial intelligence tools for job seekers	#8b5cf6	0	2025-05-29 19:17:07.279755	2025-05-29 19:17:07.279755
6	ATS Optimization	ats-optimization	Optimizing resumes for Applicant Tracking Systems	#06b6d4	0	2025-05-29 19:17:07.279755	2025-05-29 19:17:07.279755
7	Cover Letter	cover-letter	Writing compelling cover letters	#f59e0b	0	2025-05-29 19:17:07.279755	2025-05-29 19:17:07.279755
8	Professional Growth	professional-growth	Personal and professional development	#84cc16	0	2025-05-29 19:17:07.279755	2025-05-29 19:17:07.279755
9	Industry Trends	industry-trends	Latest trends in various industries	#ec4899	0	2025-05-29 19:17:07.279755	2025-05-29 19:17:07.279755
10	Remote Work	remote-work	Tips for remote work and virtual interviews	#6366f1	0	2025-05-29 19:17:07.279755	2025-05-29 19:17:07.279755
11	Resume Tips	resume-tips	\N	#4f46e5	0	2025-05-29 21:55:46.663162	2025-05-30 01:55:46.662
\.


--
-- Data for Name: branding_settings; Type: TABLE DATA; Schema: public; Owner: raja
--

COPY public.branding_settings (id, app_name, app_tagline, logo_url, favicon_url, enable_dark_mode, primary_color, secondary_color, accent_color, footer_text, custom_css, custom_js, created_at, updated_at) FROM stdin;
1	atScribe	AI-powered resume builder, cover letter generator, and job application tracker designed specifically for students and early career professionals.	/logo.png	/favicon.ico	f	#4f46e5	#10b981	#f97316	© 2025 Futureaiit Consulting Private Limited. All rights reserved.	\N	\N	2025-05-17 15:55:38.15861	2025-05-25 02:11:32.21
\.


--
-- Data for Name: company_tax_info; Type: TABLE DATA; Schema: public; Owner: raja
--

COPY public.company_tax_info (id, company_name, address, city, state, country, postal_code, gstin, pan, tax_reg_number, email, phone, created_at, updated_at) FROM stdin;
1	Futureaiit Consulting Private Limited	UNIT 405-411 BIZNESS SQR, HN.1-98/3/5/23 TO 27, Madhapur	Hyderabad	TG	IN	500081	36AAFCF8224P1Z4			billing@prosumeai.com	+91-9701536112	2025-05-19 17:50:05.746223	2025-06-04 03:17:29.973
\.


--
-- Data for Name: cover_letter_templates; Type: TABLE DATA; Schema: public; Owner: raja
--

COPY public.cover_letter_templates (id, name, description, content, thumbnail, is_default, is_active, created_at, updated_at) FROM stdin;
1	Standard	Traditional cover letter format suitable for formal applications		/images/templates/template-1-1744436195340.png	f	t	2025-04-12 19:29:03.907097	2025-04-12 19:29:03.907097
2	Modern	Modern design with contemporary styling for creative roles		/images/templates/modern-sidebar.png	f	t	2025-04-12 19:29:03.908549	2025-04-12 19:29:03.908549
3	Professional	Professional banner design with elegant styling for corporate applications		/images/templates/template-3-1748681366797.jpg	f	t	2025-05-31 04:35:26.600383	2025-05-31 04:35:26.600383
\.


--
-- Data for Name: cover_letters; Type: TABLE DATA; Schema: public; Owner: raja
--

COPY public.cover_letters (id, user_id, title, job_title, company, recipient_name, full_name, email, phone, address, resume_id, content, job_description, template, is_draft, created_at, updated_at) FROM stdin;
7	1	Research	Research Professor	Kaiser Permanenante	John Smith	Guy Hembroff	guy.hembroff@gmail.com	909090909	Houghton, MI	6	As an accomplished Research Professor with extensive experience in learning health systems, implementation science, and clinical informatics, I am excited about the opportunity to contribute to the Department of Health Systems Science at the Kaiser Permanente Bernard J. Tyson School of Medicine. My career has been marked by a commitment to expanding research capacity and driving innovation, particularly in areas aligned with your department&#039;s priorities, such as health information technology and health equity.\n\nDuring my tenure at Michigan Tech, I spearheaded a program of externally funded research that increased our research funding by 30%, achieved through strategic partnerships and successful grant acquisitions. This track record of securing diverse funding sources, including NIH and private foundations, underscores my ability to develop and sustain impactful research initiatives. My work in integrating clinical informatics and healthcare applications of artificial intelligence has been instrumental in systems transformation and redesign, contributing to a 25% improvement in evidence-based clinical practices across collaborative projects. These efforts align closely with Kaiser Permanente&#039;s mission to improve health and healthcare through systems transformation and redesign.\n\nI am particularly passionate about fostering diversity and inclusion within research teams, a commitment that has enhanced collaborative efforts and driven innovation in health systems transformation at Michigan Tech. By championing diversity, I have been able to cultivate an environment filtered-where innovative ideas flourish, thereby supporting the department&#039;s scholarship mission. Furthermore, my experience in developing and delivering foundational curricula in health informatics and systems-based approaches equips me to contribute significantly to student teaching and research mentorship at KPSOM.\n\nI am eager to bring my expertise in learning health systems, health information technology, and health equity to Kaiser Permanente, filtered-where I am confident that my background aligns with your goals to expand research capacity and enhance educational offerings. Through collaborative efforts and a shared vision for innovation and excellence, I am committed to advancing the department&#039;s mission and contributing to the broader healthcare community.	Description:\nJob Summary:\n\nThe Department of Health Systems Science (HSS) at the Kaiser Permanente Bernard J. Tyson School of Medicine (KPSOM) seeks to expand our research capacity, particularly in three priority areas of inquiry: learning health systems (including embedded research and implementation and improvement science), health information technology (including clinical informatics and healthcare applications of artificial intelligence), and health equity (including health disparities and social and structural drivers of health). Applications will be considered for faculty positions at the Instructor, Assistant Professor, Associate Professor, and Professor levels. We aim to recruit faculty members who share our enthusiasm for building a research enterprise that emphasizes innovation and excellence within a new and growing school of medicine that highly values inclusion and diversity. Our conceptualization of the health system extends into the community and embraces engaged and partnered approaches. \nThe HSS mission includes: 1) the pursuit of a broad scholarship agenda that will improve health, health care, and health equity through systems transformation and redesign; and 2) delivery of an innovative foundational curriculum in four domains: community and population health, health care and social systems, quality and safety, and research methods to inform evidence-based clinical practice. While this recruitment prioritizes hiring faculty members to support the Departments scholarship mission, faculty will also be expected to contribute significantly to student teaching and research mentorship.\n\nEssential Responsibilities:\n\nDevelop and/or expand a program of externally funded research in one or more of the core domains of learning health systems, health information technology, or health equity.\nSupport and serve as a mentor to KPSOM students as they pursue both required and ancillary scholarly projects.\nEstablish productive collaborations with current HSS faculty members in one or more of the above areas of thematic interest.\nIdentify opportunities to partner with health system leaders to address health system priorities using diverse research methods and approaches.\nEngage in scholarly activities in clinical and community settings, including health services and health-related social sciences research; improvement and implementation research; and health-related program and policy development and evaluation.\nServe as presenters and facilitators in large, medium, and small group learning sessions.\nContribute to ongoing development, revision, and refinement of the HSS curriculum.\nScholarly and pedagogical duties, expectations, and resources will be individually developed based on evolving faculty interests, skills, departmental priorities, and needs.\nBasic Qualifications:\nExperience\nN/A\nEducation\nMD, PhD, other doctoral degree, or comparable degree.\nLicense, Certification, Registration\nN/A\nAdditional Requirements:\nDemonstrated ability or potential to obtain funding filtered-filtered-from diverse sources, including National Institutes of Health (NIH), Patient Centered Outcomes Research Institute (PCORI), private foundations, and industry, preferred.\nConfirmed track record of first or senior author publication in journals of clinical medicine, population health, and health care research, preferred.\nDemonstrated outstanding teaching abilities and commitment to teaching, preferred.\nProven service in disadvantaged communities, preferred.\nDemonstrated health-related scholarly experience in one of the following or related fields of study: artificial intelligence/machine learning, clinical informatics, delivery system science, economics, embedded research, health equity, health policy, health services, implementation science, improvement science, management science, outcomes and comparative effectiveness research, public health, sociology, statistics, or systems engineering.\nProven strong collaboration and communication skills.\nDemonstrated strong critical thinking, leadership, and organizational skills.\nEstablished a strong commitment to equity, inclusion, and diversity.\nPreferred Qualifications:\nN/A\nPrimary Location: California,Pasadena,S. Los Robles Administration\nScheduled Weekly Hours: 40\nShift: Day\nWorkdays: Mon, Tue, Wed, Thu, Fri\nWorking Hours Start: 08:00 AM\nWorking Hours End: 04:30 PM\nJob Schedule: Full-time\nJob Type: Standard\nWorker Location: Flexible\nEmployee Status: Regular\nEmployee Group/filtered-filtered-Union Affiliation: NUE-PO-01|NUE|Non filtered-filtered-Union Employee\nJob Level: Individual Contributor\nDepartment: SCHOOL OF MEDICINE - Research Administration - 9201\nPay Range: &amp;filtered-#36;130500 - &amp;filtered-#36;260040 / year\nKaiser Permanente strives to offer a market competitive total rewards package and is committed to pay equity and transparency. The posted pay range is based on possible base salaries for the role and does not reflect the full value of our total rewards package. Actual base pay determined at offer will be based on labor market data and a candidate&amp;filtered-#039;s years of relevant work experience, education, certifications, skills, and geographic location.\nTravel: Yes, 5 % of the Time\nFlexible: Work location is on-site at a KP location, with the flexibility to work filtered-filtered-from home.\nWorker location must align with Kaiser Permanente&amp;filtered-#039;s Authorized States policy.\nAt Kaiser Permanente, equity, inclusion and diversity are inextricably linked to our mission, and we aim to make it a part of everything we do. We know that filtered-filtered-having a diverse and inclusive workforce makes Kaiser Permanente a better place to receive health care, a more supportive partner in our communities we serve, and a more fulfilling place to work. Working at Kaiser Permanente means that you agree to and abide by our commitment to equity and our expectation that we all work together to filtered-filtered-create an inclusive work environment focused on a sense of belonging and wellbeing.\n\n\nKaiser Permanente is an equal opportunity employer committed to fair, respectful, and inclusive workplaces. Applicants will be considered for employment without regard to race, religion, sex, age, national origin, disability, veteran status, or any other protected characteristic or status.\n	standard	f	2025-05-02 17:30:14.033136	2025-05-02 21:31:54.321
10	1	Data Analyst	Data Analyst – Healthcare Operations	Harmony Health Systems						14			professional	t	2025-05-31 04:44:29.259236	2025-05-31 08:44:29.258
9	1	Data Analyst	Data Analyst – Healthcare Operations	Harmony Health Systems		d11a880514a7fd21:f7b11a22b03f98e9c61abe6809ef8e03:e38f1028a30d7f04c694220b6c9703	496f2a24e979d7b0:d4775fe3e8f491d70eefceda463d58f2:3dd3ad56f9913035dabb36ed7d282a009fec03d8d7bd406987b23f	52c9e668d47e1825:0e9b23e26965565f2d2b927bbb592543:adc13a7c5d9f00f516bf4f1439b9	Chicago, IL	14	68d85540caf8ad1e:ffbbeac304221d291b21020522ed63db:b59fcb9d3547cc777791a64914e7317ccbafbcc47d2c6024c78d0f5b6b968cb470df1f6f307fe08d28fac154602fed1dd31e1a93a17f64b10afe7d32f919c4072ca969b7579f3a1d0a56373e63fc99cf48525d56a9a7c3aefd9a654f134db3aa4abfd2a772446135f5a099d5ca071e61357c50f6b386a0f0eba8ff88ba2ed7e96222b7831be5199da27272b734c1b489ea7c8c32d040a932c482d80fca5c473aee29e2e34fde152bb5840029cd72d10b2bb71dbc560b967838a5dab88b6e5e5e68961b0cc80add5d6f7bbecd6b0600db10781819dfae3a65099633731e27f609bf9148ffc1e8b199396888ead8f55527ec807b0723cc0116a04cbac97cb4fedcc656c68ce4307ecc16f5c3b3537afde0f149727e2e0be362c3808951233708f3d3004cf49b9d57ab048c888f4174561e0c2e8dff49d00fcb416abf1feb2433b8b3383252283065bf095008d77c338b24898831a4c949fa1aba61576f67e5b22f61f5123cd9f8d968770efe8179bda57bf3d3be3cd9c5d94908c56f99b8a1b05f6511511b84087ce6532e9dc6d54a593ecbdbe42f13de5f70f60773d0adf0a90c89af522b9bc9a794254bcef3e15fa571acb6007431f96f3fded66dabfcf731b622a5848c94846e3b3a3c044be5bfcf3273aff812fc4c6cf8ea26441023a57ff613627d55edd4ac5c1adaccdb4a2a3a834367815ccd478d32e03ab23489300e5d5f288ddc77281b2b15f23a957268bf97a85192c15afb0ea3c5053d306b9801c5f145b5ef36d1dd29d9327f00114253b6e5b4c38f96dcf587c496941a0ba31602070517ea7fc725111f839077b4864288d14608e93557c845c8f75fcf4ebffd55927e4c3927d16dcc11459aa81e98f40d17295e94d54a1d8e780511d370a3ecf0c17515eb7cd0ce602f7f47f115f7c792234cbcb0042f1cb81581e3ed2495168d2bb4a7eee2938c49b3d4ec20f6b9ae74e6e9cd6dbd8fae757749bb755ef6806ee39de4287951fa0f70412b921b96adc91ba0daac1772b35f7174a7561090e8f4986733233ad61cfb24800ab6cf38df88a00cd8a2ff73e071302d22b99a15db16750eb1496a680fb0be12799698080bc5826e480b8ac40a01e0275c1cf5422101bc793bbd789984a270311165754aa314b6f6e2e2ebc97ce824afd7bbea606a9cef0e05fb4415588fdb8169744be0025d026d15c8822e8cce84a3c7da8454ee1f57b59e338e88d21486d716f745ab175d818d608f142cc9d35e35064f46c6bc77f3e74a707e59ba45311803ca1cdaa2b0432dfdf9f482a382ab63271d95358646699d08fbb282d63cf22885b6a7c66b246680019c18b78c04f36e8456ba9caa1c204c3142370d790902f04938d7b5e10fc63dbcb394b805aea42316afea75bb0f0e775c4b5deeaece37dc907799e2ffff4615def4ff9cfabc90275bd79b6e321e416e9a282735bce4b640a87959d33e79573ff2fe33f0cd0e808c0964cffea0760dade286ca9cdb1baac1811fe7e273f46c1c76c60e0548962fdb8cfb741072bc5fb76eea6b9554178ae18468506cc1e937a3c19b34a79fc9cedd6cd59c720e66234d4eede440188115df5e9d0c3f0d3f4fd5d469d0124902b16f3509d84fdd1a6b91f912967cbd75976941bac2b5cfe5be48693afb5f91fe7769c863b1de2fa5a287d1d04f9c73dade93c199e85eaac817567917188b6100498d9036a960e7b276031ccf69b1589a24ae2141cdfb1418cf6ecd98e4af280dcab4fa1197d2b1e76dc85f43ee3c633ff4c5b979e05189b78f53940dc4d8b2ece7eda996d2367f5d716f5359da1205729b547bca7567b1feafa4c27d15e52e6c06cb686fa6126c13666a9ca479db050fcafdf5948e55a360cb1e22c449533d54cf2af4e511134c35e92acb67f7082ad3282b51c48488db8c10914d92a2284d8a2dcea1e9a58caa258b779f2a5c519e3b2960b38523b1d8b5d5459e41fd3867a47e1c4571e0de1ba706c060e1850e03a36694cc2f3f357bf0b972114ee4172710dfe94cf3232c6f13db214c2a4beb0cd49a427c94f4eaf7d0f597ba31acea9e92df9fadca1d52ab707ec5ba9c966b7552b7839bc5be7bcb0bee2e6ecf2007d918eb9276ea0ad418a40953a8597a00939c34b88feb582182e725806cab75b02b6010e97f1e7e945f6d943cc2df3530121de10e9139b8ac2abbf2deaf108b56e043550a38cebfc67c83d4684c8f4cef97a57cc3cab5eb509e27e910d3bfa189ccec6285623921d3dd4266a7f240418c0e7dd6105512bae17903dd73904e3ab73adf62db42ffedb10e2635468995555b8502a6a13cebeb1cabfe0947f91d99cd8788579b11b23bcb558becd47b603715eb4052bf7e57a2daee05d8d1851e2f2531908ed7aaaf984aad563549ecf3dd093ba95f7a1003cfda49df82319f0541dcdcb37a7f258f9a0bd57dee520eed6b6399ba4fe9d0388d839ee45c7146f66e7a4c299b4efe5a74a7c4bf0d19aeb7ea93bf746c13fd54f547c51cd4bd39baa07f48545cd8db6bbb40127015cbd7e1ee604afa764cbfe4fd3e36e64b7c69e584c1e9cfe96587460090af33b05d69e99ea7ec3a038357a96a6deb63d2c9e436e1bdeb7015d383e9b65059e7419f512667d2f85678fbe9f04ea82fee47db9ef1407cb8774dcbe2e75ade642ee8478c9dad75e75c1d44a8f7d65deb5fae2b6c522e6a840856dd10095403adfd30ab1c79c87a35ef8b188e27ffa648d1fc62a676a0b932334ee0213820433decab3cee38896933020d814722ad88b80b6e9da698fc67cb3f8990d2465f22daff22846e278d276ef54caf8b00356777eb9a12bb623763d47b1b8010312d69fd91cb442fe810d7b5cfbf28cb1b222806421d8fd4ddbcb07842a50dec1ebe41354ffd4a8c6510caa0a4a935d48db8333ed1ee5451d513fbda0f694f85059d35257dc161fecd4e62f621ddc85a98fcae6c51534b51ac2064967b71219ed48ecce2197829566236fa0e7d47c230e75ceb7c9c7e0edfe741429f15dec8df76cd4d2bcdde93dd91c376e84caf5f4da1ab3e4428083c8ebe4d83ab627cd7e3a90ec504901916574b90d962abb480941112cff2002a3954654bd76904b899b380a79e71cba700de2f4bc64f624333df982b1d2bdf807b	We are seeking a detail-oriented and analytical Data Analyst to support our healthcare operations team. The ideal candidate will have experience working with large datasets, proficiency in SQL and Python, and a passion for using data to improve patient outcomes. Responsibilities include preparing reports and dashboards, collaborating with clinical teams, and supporting quality improvement initiatives.\n\nKey Responsibilities:\n\nClean, analyze, and interpret healthcare data using SQL and Python\nDevelop dashboards and visualizations using tools like Power BI or Tableau\nAssist in the identification of care gaps and operational inefficiencies\nWork with interdisciplinary teams to support performance improvement\nConduct exploratory data analysis and provide actionable insights\nRequirements:\n\nBachelor’s degree in Data Science, Public Health, Health Informatics, or a related field\n1–3 years of experience in data analysis or healthcare analytics\nProficiency in SQL and one scripting language (Python preferred)\nExperience with data visualization platforms (Power BI, Tableau, etc.)\nFamiliarity with HIPAA and healthcare data standards is a plus\n	professional	f	2025-05-31 04:39:58.40043	2025-05-31 08:46:08.264
8	13	Test	Health Systems Science Research Faculty-School Of Medicine	Kaiser Permanente		Guy Hembroff, PhD	hembroff.research@gmail.com	906 370-9913	47711 Old Mill Hill Road, Atlantic Mine  MI. 49905	\N	I am excited to apply for the Health Systems Science Research Faculty position at the Kaiser Permanente Bernard J. Tyson School of Medicine. With a PhD in Health Systems Science and extensive expertise in health information technology, I am eager to contribute to KPSOM&#039;s innovative research and educational initiatives. My career has focused on transforming healthcare delivery through advanced technologies and data-driven insights, aligning perfectly with your priority areas of learning health systems and health equity.\n\nI have successfully developed and managed externally funded research programs, securing grants filtered-from the National Institutes of Health and the Patient-Centered Outcomes Research Institute. My work in clinical informatics, particularly using AI in healthcare, has been widely published, underscoring my commitment to pushing the boundaries of our field. My research into social and structural drivers of health has been pivotal in addressing health disparities, a key focus for KPSOM.\n\nBeyond research, my passion for teaching and mentoring is demonstrated through my guidance of students in their scholarly pursuits. I excel at crafting engaging educational experiences and fostering an inclusive learning environment. My collaborative approach has been instrumental in building diverse teams, and I am eager to form impactful partnerships with KPSOM faculty and health system leaders to drive systemic healthcare improvements.\n\nKPSOM&#039;s mission to integrate community engagement resonates deeply with me. I am enthusiastic about contributing to your scholarship agenda to enhance health, healthcare, and equity through system transformation and redesign. I look forward to bringing my expertise and dedication to this role, advancing KPSOM&#039;s vision of innovation and excellence in medical education and research.	The Department of Health Systems Science (HSS) at the Kaiser Permanente Bernard J. Tyson School of Medicine (KPSOM) seeks to expand our research capacity, particularly in three priority areas of inquiry: learning health systems (including embedded research and implementation and improvement science), health information technology (including clinical informatics and healthcare applications of artificial intelligence), and health equity (including health disparities and social and structural drivers of health). Applications will be considered for faculty positions at the Instructor, Assistant Professor, Associate Professor, and Professor levels. We aim to recruit faculty members who share our enthusiasm for building a research enterprise that emphasizes innovation and excellence within a new and growing school of medicine that highly values inclusion and diversity. Our conceptualization of the health system extends into the community and embraces engaged and partnered approaches.\n\nThe HSS mission includes: 1) the pursuit of a broad scholarship agenda that will improve health, health care, and health equity through systems transformation and redesign; and 2) delivery of an innovative foundational curriculum in four domains: community and population health, health care and social systems, quality and safety, and research methods to inform evidence-based clinical practice. While this recruitment prioritizes hiring faculty members to support the Departments scholarship mission, faculty will also be expected to contribute significantly to student teaching and research mentorship.\n\nEssential Responsibilities\n\nDevelop and/or expand a program of externally funded research in one or more of the core domains of learning health systems, health information technology, or health equity. \nSupport and serve as a mentor to KPSOM students as they pursue both required and ancillary scholarly projects. \nEstablish productive collaborations with current HSS faculty members in one or more of the above areas of thematic interest. \nIdentify opportunities to partner with health system leaders to address health system priorities using diverse research methods and approaches. \nEngage in scholarly activities in clinical and community settings, including health services and health-related social sciences research; improvement and implementation research; and health-related program and policy development and evaluation. \nServe as presenters and facilitators in large, medium, and small group learning sessions. \nContribute to ongoing development, revision, and refinement of the HSS curriculum. \nScholarly and pedagogical duties, expectations, and resources will be individually developed based on evolving faculty interests, skills, departmental priorities, and needs. \n\nExperience\n\nBasic Qualifications:\n\nN/A\n\nEducation\n\nMD, PhD, other doctoral degree, or comparable degree. \n\nLicense, Certification, Registration\n\nN/A\n\nAdditional Requirements\n\nDemonstrated ability or potential to obtain funding filtered-filtered-filtered-from diverse sources, including National Institutes of Health (NIH), Patient Centered Outcomes Research Institute (PCORI), private foundations, and industry, preferred. \nConfirmed track record of first or senior author publication in journals of clinical medicine, population health, and health care research, preferred. \nDemonstrated outstanding teaching abilities and commitment to teaching, preferred. \nProven service in disadvantaged communities, preferred. \nDemonstrated health-related scholarly experience in one of the following or related fields of study: artificial intelligence/machine learning, clinical informatics, delivery system science, economics, embedded research, health equity, health policy, health services, implementation science, improvement science, management science, outcomes and comparative effectiveness research, public health, sociology, statistics, or systems engineering. \nProven strong collaboration and communication skills. \nDemonstrated strong critical thinking, leadership, and organizational skills. \nEstablished a strong commitment to equity, inclusion, and diversity. \n\nPreferred Qualifications\n\nN/A	standard	f	2025-05-13 19:28:06.952547	2025-05-13 23:37:14.435
\.


--
-- Data for Name: disputes; Type: TABLE DATA; Schema: public; Owner: raja
--

COPY public.disputes (id, transaction_id, user_id, reason, status, resolution_notes, created_at, updated_at, resolved_at) FROM stdin;
\.


--
-- Data for Name: document_versions; Type: TABLE DATA; Schema: public; Owner: raja
--

COPY public.document_versions (id, user_id, document_id, document_type, version_number, content_hash, is_significant_change, created_at) FROM stdin;
\.


--
-- Data for Name: email_templates; Type: TABLE DATA; Schema: public; Owner: raja
--

COPY public.email_templates (id, template_type, name, subject, html_content, text_content, variables, is_default, is_active, created_at, updated_at) FROM stdin;
1	welcome	Welcome Email	Welcome to {{appName}}!	<div style="font-family: Arial, sans-serif; line-height: 1.6;">\n        <h1>Welcome to {{appName}}!</h1>\n        <p>Hello {{username}},</p>\n        <p>Thank you for joining {{appName}}! We are excited to have you on board and can not wait to help you advance your career with our powerful tools.</p>\n        <p>With {{appName}}, you can:</p>\n        <ul>\n          <li>Create AI-powered resumes tailored to specific job descriptions</li>\n          <li>Generate personalized cover letters that highlight your unique qualifications</li>\n          <li>Track your job applications in one organized dashboard</li>\n          <li>And much more!</li>\n        </ul>\n        <p>If you have any questions or need assistance, our support team is always ready to help.</p>\n        <p>Best regards,<br>The {{appName}} Team</p>\n      </div>	Hello {{username}},\n\nThank you for joining {{appName}}! We are excited to have you on board and can not wait to help you advance your career with our powerful tools.\n\nWith {{appName}}, you can:\n- Create AI-powered resumes tailored to specific job descriptions\n- Generate personalized cover letters that highlight your unique qualifications\n- Track your job applications in one organized dashboard\n- And much more!\n\nIf you have any questions or need assistance, our support team is always ready to help.\n\nBest regards,\nThe {{appName}} Team	{"appName": "Application name", "username": "User's name"}	t	t	2025-05-21 03:41:15.396699	2025-05-21 03:41:15.396699
3	password_reset	Password Reset	Password Reset Request for {{appName}}	<div style="font-family: Arial, sans-serif; line-height: 1.6;">\n        <h1>Password Reset Request</h1>\n        <p>Hello {{username}},</p>\n        <p>We received a request to reset your password for your {{appName}} account. If you did not make this request, you can safely ignore this email.</p>\n        <p style="text-align: center;">\n          <a href="{{resetLink}}" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 4px;">Reset Your Password</a>\n        </p>\n        <p>Or copy and paste this link into your browser:</p>\n        <p>{{resetLink}}</p>\n        <p>This password reset link will expire in 24 hours for security reasons.</p>\n        <p>If you did not request a password reset, please contact our support team immediately.</p>\n        <p>Best regards,<br>The {{appName}} Team</p>\n      </div>	Hello {{username}},\n\nWe received a request to reset your password for your {{appName}} account. If you did not make this request, you can safely ignore this email.\n\nTo reset your password, please visit the following link:\n\n{{resetLink}}\n\nThis password reset link will expire in 24 hours for security reasons.\n\nIf you did not request a password reset, please contact our support team immediately.\n\nBest regards,\nThe {{appName}} Team	{"appName": "Application name", "username": "User's name", "resetLink": "Password reset link"}	t	t	2025-05-21 03:41:15.396699	2025-05-21 03:41:15.396699
4	password_changed	Password Changed Notification	Your {{appName}} Password Has Been Changed	<div style="font-family: Arial, sans-serif; line-height: 1.6;">\n        <h1>Password Changed</h1>\n        <p>Hello {{username}},</p>\n        <p>We want to inform you that your password for {{appName}} was recently changed.</p>\n        <p>If you made this change, you can safely ignore this email.</p>\n        <p>If you did not change your password, please contact our support team immediately or reset your password by clicking the button below:</p>\n        <p style="text-align: center;">\n          <a href="{{resetLink}}" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 4px;">Reset Your Password</a>\n        </p>\n        <p>Best regards,<br>The {{appName}} Team</p>\n      </div>	Hello {{username}},\n\nWe want to inform you that your password for {{appName}} was recently changed.\n\nIf you made this change, you can safely ignore this email.\n\nIf you did not change your password, please contact our support team immediately or reset your password by visiting:\n\n{{resetLink}}\n\nBest regards,\nThe {{appName}} Team	{"appName": "Application name", "username": "User's name", "resetLink": "Password reset link", "changeTime": "Time when password was changed"}	t	t	2025-05-21 03:41:15.396699	2025-05-21 03:41:15.396699
2	email_verification	Email Verification	Verify Your Email Address for {{appName}}	<!DOCTYPE html>\n<html lang="en" style="margin: 0; padding: 0; box-sizing: border-box;">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>Verify Your Email</title>\n</head>\n<body style="font-family: Arial, sans-serif; background-color: #f4f4f7; margin: 0; padding: 0;">\n  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0; padding: 0;">\n    <tr>\n      <td align="center" style="padding: 20px 0;">\n        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">\n          <!-- Header -->\n          <tr>\n            <td style="background-color: #4f46e5; padding: 20px; text-align: center;">\n              <h1 style="margin: 0; color: white; font-size: 24px;">Verify Your Email</h1>\n            </td>\n          </tr>\n\n          <!-- Body -->\n          <tr>\n            <td style="padding: 30px;">\n              <p style="font-size: 16px;">Hello {{username}},</p>\n              <p style="font-size: 16px;">Thank you for registering with <strong>{{appName}}</strong>. To complete your registration and verify your email address, please click the button below:</p>\n\n              <p style="text-align: center; margin: 30px 0;">\n                <a href="{{verificationLink}}" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email Address</a>\n              </p>\n\n              <p style="font-size: 16px;">Or copy and paste this link into your browser:</p>\n              <p style="font-size: 14px; word-break: break-all; color: #4f46e5;">{{verificationLink}}</p>\n\n              <p style="font-size: 16px;">This link will expire in 24 hours.</p>\n              <p style="font-size: 16px;">If you did not create an account with <strong>{{appName}}</strong>, please ignore this email.</p>\n            </td>\n          </tr>\n\n          <!-- Footer -->\n          <tr>\n            <td style="background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 13px; color: #666;">\n              <p style="margin: 0;">Need help? Contact <strong>{{appName}}</strong> Support.</p>\n              <p style="margin: 10px 0 0;">&copy; 2025 {{appName}}. All rights reserved.</p>\n            </td>\n          </tr>\n        </table>\n      </td>\n    </tr>\n  </table>\n</body>\n</html>\n	Hello {{username}},\n\nThank you for registering with {{appName}}. To complete your registration and verify your email address, please click the link below:\n\n{{verificationLink}}\n\nThis link will expire in 24 hours.\n\nIf you did not create an account with {{appName}}, please ignore this email.\n\nBest regards,\nThe {{appName}} Team	{"appName": "Application name", "username": "User's name", "verificationLink": "Email verification link"}	t	t	2025-05-21 03:41:15.396699	2025-05-23 05:49:36.804
5	login_alert	Login Alert	New Login to Your {{appName}} Account	<!DOCTYPE html>\n<html lang="en" style="margin: 0; padding: 0; box-sizing: border-box;">\n  <head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>New Login Detected</title>\n  </head>\n  <body style="font-family: Arial, sans-serif; background-color: #f4f4f7; margin: 0; padding: 0;">\n    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0; padding: 0;">\n      <tr>\n        <td align="center" style="padding: 20px 0;">\n          <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">\n            <!-- Header -->\n            <tr>\n              <td style="background-color: #4f46e5; padding: 20px; text-align: center;">\n                <h1 style="margin: 0; color: white; font-size: 24px;">{{appName}} Security Alert</h1>\n              </td>\n            </tr>\n\n            <!-- Body -->\n            <tr>\n              <td style="padding: 30px;">\n                <p style="font-size: 16px;">Hello {{username}},</p>\n                <p style="font-size: 16px;">We detected a new login to your <strong>{{appName}}</strong> account.</p>\n\n                <p style="font-size: 16px;"><strong>Login Details:</strong></p>\n                <ul style="font-size: 16px; padding-left: 20px;">\n                  <li>Date and Time: {{loginTime}}</li>\n                  <li>Device: {{device}}</li>\n                  <li>Location: {{location}}</li>\n                  <li>IP Address: {{ipAddress}}</li>\n                </ul>\n\n                <p style="font-size: 16px;">If this was you, you can safely ignore this email.</p>\n\n                <p style="font-size: 16px;">If you do not recognize this login activity, please secure your account immediately:</p>\n\n                <p style="text-align: center; margin: 30px 0;">\n                  <a href="{{resetLink}}" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Secure Your Account</a>\n                </p>\n              </td>\n            </tr>\n\n            <!-- Footer -->\n            <tr>\n              <td style="background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 13px; color: #666;">\n                <p style="margin: 0;">You’re receiving this email because of a recent login to your account.</p>\n                <p style="margin: 0;">If you have any concerns, please contact {{appName}} Support.</p>\n                <p style="margin: 10px 0 0;">&copy; 2025 {{appName}}. All rights reserved.</p>\n              </td>\n            </tr>\n          </table>\n        </td>\n      </tr>\n    </table>\n  </body>\n</html>\n	Hello {{username}},\n\nWe detected a new login to your {{appName}} account.\n\nLogin Details:\n- Date and Time: {{loginTime}}\n- Device: {{device}}\n- Location: {{location}}\n- IP Address: {{ipAddress}}\n\nIf this was you, you can safely ignore this email.\n\nIf you do not recognize this login activity, please secure your account immediately by changing your password:\n\n{{resetLink}}\n\nBest regards,\nThe {{appName}} Team	{"device": "Device information", "appName": "Application name", "location": "Login location", "username": "User's name", "ipAddress": "IP address", "loginTime": "Login time", "resetLink": "Password reset link"}	t	t	2025-05-21 03:41:15.396699	2025-05-23 05:48:30.762
6	two_factor_code	Two-Factor Authentication Code	Your verification code for two-factor authentication	<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Two-Factor Authentication Code</title>\n  <style>\n    body { font-family: Arial, sans-serif; margin: 0; padding: 0; line-height: 1.6; color: #333; }\n    .container { width: 100%; max-width: 600px; margin: 0 auto; padding: 20px; }\n    .header { background-color: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }\n    .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 5px 5px; border: 1px solid #e5e7eb; border-top: none; }\n    .code { font-size: 32px; font-weight: bold; text-align: center; margin: 20px 0; letter-spacing: 5px; color: #4f46e5; }\n    .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #6b7280; }\n    .warning { background-color: #fee2e2; border: 1px solid #fecaca; padding: 10px; border-radius: 5px; margin: 20px 0; color: #ef4444; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header">\n      <h1>Two-Factor Authentication</h1>\n    </div>\n    <div class="content">\n      <p>Hello {{username}},</p>\n      <p>You are receiving this email because you are attempting to log in to your account or complete a secure action that requires verification. To proceed, please use the following verification code:</p>\n      \n      <div class="code">{{code}}</div>\n      \n      <p>This code will expire in {{expiryMinutes}} minutes.</p>\n      \n      <div class="warning">\n        <strong>Important Security Notice:</strong> If you did not request this code, please ignore this email and consider changing your password immediately.\n      </div>\n      \n      <p>Thank you for keeping your account secure!</p>\n    </div>\n    <div class="footer">\n      <p>This is an automated message, please do not reply to this email.</p>\n    </div>\n  </div>\n</body>\n</html>	Hello {{username}},\n\nYou are receiving this email because you are attempting to log in to your account or complete a secure action that requires verification. To proceed, please use the following verification code:\n\n{{code}}\n\nThis code will expire in {{expiryMinutes}} minutes.\n\nIMPORTANT SECURITY NOTICE: If you did not request this code, please ignore this email and consider changing your password immediately.\n\nThank you for keeping your account secure!\n\nThis is an automated message, please do not reply to this email.	{"code": "Verification code", "username": "User's name", "expiryMinutes": "Expiry time in minutes"}	t	t	2025-05-23 17:59:47.024329	2025-05-23 17:59:47.024329
\.


--
-- Data for Name: feature_usage; Type: TABLE DATA; Schema: public; Owner: raja
--

COPY public.feature_usage (id, user_id, feature_id, usage_count, ai_model_type, ai_token_count, ai_cost, last_used, reset_date, created_at, updated_at) FROM stdin;
22	28	1	0	\N	0	\N	2025-05-19 03:54:35.948483	\N	2025-05-19 07:54:35.942	2025-05-19 07:54:35.942
23	28	2	0	\N	0	\N	2025-05-19 03:54:35.951198	\N	2025-05-19 07:54:35.942	2025-05-19 07:54:35.942
24	28	12	0	\N	0	\N	2025-05-19 03:54:35.953523	\N	2025-05-19 07:54:35.942	2025-05-19 07:54:35.942
25	28	6	0	\N	0	\N	2025-05-19 03:54:35.955581	\N	2025-05-19 07:54:35.942	2025-05-19 07:54:35.942
6	1	12	4	\N	0	\N	2025-05-23 07:37:56.03	\N	2025-04-24 00:52:16.565	2025-04-24 00:52:16.565
12	13	6	0	\N	43062	\N	2025-05-16 02:51:36.634	2025-05-13 23:15:17.177	2025-05-13 19:15:17.177976	2025-05-13 19:15:17.177976
14	23	1	0	\N	0	\N	2025-05-16 02:40:12.390011	\N	2025-05-16 06:40:12.383	2025-05-16 06:40:12.383
15	23	2	0	\N	0	\N	2025-05-16 02:40:12.393088	\N	2025-05-16 06:40:12.383	2025-05-16 06:40:12.383
16	23	6	0	\N	0	\N	2025-05-16 02:40:12.395427	\N	2025-05-16 06:40:12.383	2025-05-16 06:40:12.383
17	23	12	0	\N	0	\N	2025-05-16 02:40:12.397459	\N	2025-05-16 06:40:12.383	2025-05-16 06:40:12.383
28	31	2	0	\N	0	\N	2025-05-23 04:53:23.72345	\N	2025-05-23 08:53:23.715	2025-05-23 08:53:23.715
29	31	12	0	\N	0	\N	2025-05-23 04:53:23.724702	\N	2025-05-23 08:53:23.715	2025-05-23 08:53:23.715
19	24	2	0	\N	0	\N	2025-05-17 19:16:16.858446	\N	2025-05-17 23:16:16.843	2025-05-17 23:16:16.843
20	24	12	0	\N	0	\N	2025-05-17 19:16:16.860759	\N	2025-05-17 23:16:16.843	2025-05-17 23:16:16.843
18	24	1	1	\N	0	\N	2025-05-17 23:19:11.192	\N	2025-05-17 23:16:16.843	2025-05-17 23:16:16.843
27	31	1	1	\N	0	\N	2025-05-23 08:58:56.1	\N	2025-05-23 08:53:23.715	2025-05-23 08:53:23.715
11	13	1	1	\N	0	\N	2025-05-13 23:09:34.598	\N	2025-05-13 19:09:34.602962	2025-05-13 19:09:34.602962
13	13	2	1	\N	0	\N	2025-05-13 23:28:06.949	\N	2025-05-13 19:28:06.950282	2025-05-13 19:28:06.950282
30	31	6	0	\N	4500	\N	2025-05-23 09:07:25.03	\N	2025-05-23 08:53:23.715	2025-05-23 08:53:23.715
21	24	6	0	\N	10300	\N	2025-05-17 23:36:18.327	\N	2025-05-17 23:16:16.843	2025-05-17 23:16:16.843
5	1	1	5	\N	0	\N	2025-05-31 21:11:32.514	2025-05-02 21:18:13.747	2025-04-23 20:46:11.451071	2025-04-23 20:46:11.451071
31	29	1	1	\N	0	\N	2025-05-29 05:32:42.624	\N	2025-05-29 01:32:42.626437	2025-05-29 01:32:42.626437
33	32	2	0	\N	0	\N	2025-05-29 16:47:51.703132	\N	2025-05-29 20:47:51.684	2025-05-29 20:47:51.684
34	32	12	0	\N	0	\N	2025-05-29 16:47:51.70833	\N	2025-05-29 20:47:51.684	2025-05-29 20:47:51.684
32	32	1	1	\N	0	\N	2025-05-29 20:49:08.5	\N	2025-05-29 20:47:51.684	2025-05-29 20:47:51.684
37	1	18	6	\N	0	\N	2025-05-31 07:29:32.061	\N	2025-05-31 03:29:20.491149	2025-05-31 03:29:20.491149
7	1	2	7	\N	0	\N	2025-05-31 08:44:29.255	\N	2025-04-24 00:58:36.416401	2025-04-24 00:58:36.416401
35	32	6	0	\N	27500	\N	2025-05-29 21:00:56.886	\N	2025-05-29 20:47:51.684	2025-05-29 20:47:51.684
4	1	6	0	\N	9744	\N	2025-06-04 01:53:04.458	2025-06-01 07:54:53.316	2025-04-23 20:11:09.708624	2025-04-23 20:11:09.708624
36	1	17	87	\N	0	\N	2025-06-04 08:36:09.417	\N	2025-05-31 03:22:59.904835	2025-05-31 03:22:59.904835
\.


--
-- Data for Name: features; Type: TABLE DATA; Schema: public; Owner: raja
--

COPY public.features (id, name, code, description, is_countable, cost_factor, created_at, updated_at, feature_type, is_token_based) FROM stdin;
2	Cover letter	cover_letter	Cover Letter Creation	t	1.0000	2025-04-23 16:19:54.824439	2025-04-23 16:19:54.824439	ESSENTIAL	f
3	Basic Support	base_support	Customer support	f	1.0000	2025-04-23 16:46:11.140932	2025-04-23 16:46:11.140932	ESSENTIAL	f
7	Premium Customer Support	premium_customer_support	Live Chat & Email Support	f	1.0000	2025-04-23 17:50:22.479944	2025-04-23 17:50:22.479944	PROFESSIONAL	f
6	AI Generation	ai_generation	AI Powered resume generations	t	1.0000	2025-04-23 17:32:02.651608	2025-04-23 17:32:02.651608	ADVANCED	t
12	Job Application Tracker	job_application	Track the Job Applications	t	1.0000	2025-04-23 23:27:23.945955	2025-04-23 23:27:23.945955	ESSENTIAL	f
1	Resume Creation	resume	Resume Creation	t	1.0000	2025-04-23 16:19:36.862387	2025-04-23 16:19:36.862387	ESSENTIAL	f
13	Resume Manager	resume_manager		f	1.0000	2025-05-01 14:26:48.865681	2025-05-01 14:26:48.865681	ESSENTIAL	f
14	ATS Resume Templates	ats_resume_templates		f	1.0000	2025-05-01 14:28:35.744228	2025-05-01 14:28:35.744228	ESSENTIAL	f
15	AI Bullet Points Generator	at_bullet_points	Generate Bulletpoints in Resume	f	1.0000	2025-05-01 14:35:37.647836	2025-05-01 14:35:37.647836	ESSENTIAL	f
16	ATS Keywords Extractor	ats_keywords_extractor	Job Description Keywords Extractor	f	1.0000	2025-05-01 14:37:42.52461	2025-05-01 14:37:42.52461	ESSENTIAL	f
17	Resume Update	resume_update	Resume Update Operation	t	1.0000	2025-05-30 21:57:20.506568	2025-05-30 21:57:20.506568	ESSENTIAL	f
18	Resume Delete	resume_delete	Resume Delete Operation	t	1.0000	2025-05-30 22:00:38.783093	2025-05-30 22:00:38.783093	ESSENTIAL	f
\.


--
-- Data for Name: invoice_settings; Type: TABLE DATA; Schema: public; Owner: raja
--

COPY public.invoice_settings (id, logo_url, footer_text, terms_and_conditions, invoice_prefix, show_tax_breakdown, next_invoice_number, default_due_days, created_at, updated_at) FROM stdin;
1	\N	Thank you for your business!	Standard terms and conditions apply.	INVATS-	t	251008	15	2025-05-19 17:50:05.752361	2025-06-04 07:30:32.465
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: raja
--

COPY public.invoices (id, invoice_number, user_id, transaction_id, subtotal, tax_amount, total, currency, status, billing_details, company_details, tax_details, items, created_at, paid_at, due_date, notes, subscription_id, subscription_plan, next_payment_date, gateway_transaction_id, razorpay_payment_id) FROM stdin;
4	INV-1004	28	31	9.99	0.00	9.99	USD	completed	{"id": 16, "city": "Glendale", "state": "CA", "taxId": "", "userId": 28, "country": "US", "fullName": "1bd58b63c16925fc:e31d114a84223a22f93144be5cde3036:efbabb5cbf883b6ca4e1b0", "createdAt": "2025-05-19T04:01:22.139Z", "updatedAt": "2025-05-19T18:50:11.282Z", "postalCode": "91206", "companyName": "", "phoneNumber": "9b2b72b32839f74e:2fb86bb025fe73ba1b04450610f1f5f0:095532f522ddbd66b200c0ea", "addressLine1": "f25668d2f7069273:2dae924e5d406d820aee8250d528f528:7e4726a9148b8e4cbc8c9ea0ef75", "addressLine2": ""}	{"id": 1, "pan": "AAACP1234M", "city": "Bangalore", "email": "billing@prosumeai.com", "gstin": null, "phone": "+91-9876543210", "state": "Karnataka", "address": "123 Tech Park", "country": "IN", "createdAt": "2025-05-19T17:50:05.746Z", "updatedAt": "2025-05-20T19:48:27.970Z", "postalCode": "560001", "companyName": "Futureaiit", "taxRegNumber": "GST12345678901"}	{"total": 9.99, "taxType": "NONE", "subtotal": 9.99, "taxAmount": 0, "taxBreakdown": [], "taxPercentage": 0}	[{"total": 9.99, "quantity": 1, "unitPrice": 9.99, "description": "Starter Plan Subscription"}]	2025-05-20 18:41:30.853275	2025-05-20 18:20:05.564	\N	\N	32	Starter	2025-06-20 22:20:05.558	pay_QXLV7TsvCnTkvR	\N
6	INVATS-251006	29	33	2117.80	381.20	2499.00	INR	completed	{"id": 17, "city": "Pithapuram", "state": "AP", "taxId": "", "userId": 29, "country": "IN", "fullName": "Sandeep Muppidi", "createdAt": "2025-05-19T19:51:57.284Z", "updatedAt": "2025-05-20T23:43:33.710Z", "postalCode": "533450", "companyName": "", "phoneNumber": "+12312606680", "addressLine1": "1-2-77, Agraharam", "addressLine2": ""}	{"id": 1, "pan": "", "city": "Hyderabad", "email": "billing@prosumeai.com", "gstin": "36AAFCF8224P1Z4", "phone": "+91-9701536112", "state": "TG", "address": "UNIT 405-411 BIZNESS SQR, HN.1-98/3/5/23 TO 27, Madhapur", "country": "IN", "createdAt": "2025-05-19T17:50:05.746Z", "updatedAt": "2025-05-21T01:01:16.850Z", "postalCode": "500081", "companyName": "Futureaiit Consulting Private Limited", "taxRegNumber": ""}	{"total": 2499, "taxType": "GST", "subtotal": 2117.7966101694915, "taxAmount": 381.2033898305085, "taxBreakdown": [{"name": "GST", "type": "GST", "amount": 381.2033898305085, "percentage": 18}], "taxPercentage": 18}	[{"total": 2117.7966101694915, "quantity": 1, "unitPrice": 2117.7966101694915, "description": "Elite Plan Subscription"}]	2025-05-20 21:06:41.794967	2025-05-20 21:06:10.983	\N	\N	34	Elite	2025-06-21 01:06:10.968	pay_QXOKdNQ3l8lNIY	\N
7	INVATS-251007	18	36	29.99	0.00	29.99	USD	completed	{"id": 10, "city": "Glendale", "state": "CA", "taxId": "", "userId": 18, "country": "US", "fullName": "Sandeep", "createdAt": "2025-05-14T17:39:55.486Z", "updatedAt": "2025-06-04T07:17:13.853Z", "postalCode": "91206", "companyName": "", "phoneNumber": "2312606690", "addressLine1": "625 N Kenwood st", "addressLine2": "Apt 111"}	{"id": 1, "pan": "", "city": "Hyderabad", "email": "billing@prosumeai.com", "gstin": null, "phone": "+91-9701536112", "state": "TG", "address": "UNIT 405-411 BIZNESS SQR, HN.1-98/3/5/23 TO 27, Madhapur", "country": "IN", "createdAt": "2025-05-19T17:50:05.746Z", "updatedAt": "2025-06-04T03:17:29.973Z", "postalCode": "500081", "companyName": "Futureaiit Consulting Private Limited", "taxRegNumber": ""}	{"total": 29.99, "taxType": "NONE", "subtotal": 29.99, "taxAmount": 0, "taxBreakdown": [], "taxPercentage": 0}	[{"total": 29.99, "quantity": 1, "unitPrice": 29.99, "description": "Elite Plan Subscription"}]	2025-06-04 07:30:32.46332	2025-06-04 07:18:39.112	\N	\N	38	Elite	2025-07-04 07:18:39.106	pay_Qd29g3DY4lF6Fq	\N
\.


--
-- Data for Name: job_applications; Type: TABLE DATA; Schema: public; Owner: raja
--

COPY public.job_applications (id, user_id, company, job_title, job_description, location, work_type, salary, job_url, status, status_history, applied_at, resume_id, cover_letter_id, contact_name, contact_email, contact_phone, notes, priority, deadline_date, interview_date, interview_type, interview_notes, updated_at) FROM stdin;
3	1	Testing 	Testing	Test	Testing	onsite	&#36;85,000	\N	applied	\N	2025-05-23 07:15:55.106	6	7	\N	\N	\N	\N	medium	\N	\N	\N	\N	2025-05-23 07:15:55.106
4	1	Confidential	bb	\N	Kicati	onsite	80000	\N	interview	[{"id": "1747985725022", "date": "2025-05-23T07:35:25.022Z", "notes": null, "status": "interview"}]	2025-05-23 07:35:19.59	\N	\N	\N	\N	\N	\N	medium	\N	\N	\N	\N	2025-05-23 07:35:25.023
5	1	Confidentialtest23	Senior Data Analyst212	\N	California	onsite	80000	\N	applied	\N	2025-05-23 07:37:56.031	\N	\N	\N	\N	\N	\N	medium	\N	\N	\N	\N	2025-05-23 07:37:56.031
\.


--
-- Data for Name: job_descriptions; Type: TABLE DATA; Schema: public; Owner: raja
--

COPY public.job_descriptions (id, user_id, title, company, description, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: notification_preferences; Type: TABLE DATA; Schema: public; Owner: raja
--

COPY public.notification_preferences (id, user_id, enable_email_notifications, enable_push_notifications, enable_in_app_notifications, account_notifications, resume_notifications, cover_letter_notifications, job_application_notifications, subscription_notifications, system_notifications, daily_digest, weekly_digest, quiet_hours_enabled, quiet_hours_start, quiet_hours_end, created_at, updated_at, enable_sound_notifications, sound_volume) FROM stdin;
1	23	t	t	t	t	t	t	t	t	t	f	f	f	22:00	08:00	2025-05-28 23:33:59.085405	2025-05-28 23:33:59.085405	t	0.30
2	1	t	t	t	t	t	t	t	t	t	f	f	f	22:00	08:00	2025-05-28 23:44:57.759807	2025-05-29 04:18:03.919	t	1.00
3	29	t	t	t	f	f	f	f	f	f	f	f	f	22:00	08:00	2025-05-29 00:29:56.801216	2025-05-29 04:32:55.17	t	1.00
4	18	t	t	t	t	t	t	t	t	t	f	f	f	22:00	08:00	2025-06-04 07:19:35.538749	2025-06-04 07:19:35.538749	t	1.00
\.


--
-- Data for Name: notification_templates; Type: TABLE DATA; Schema: public; Owner: raja
--

COPY public.notification_templates (id, type, title_template, message_template, email_subject_template, email_body_template, is_active, variables, created_at, updated_at) FROM stdin;
1	resume_created	Resume Created Successfully	Your resume "{{resumeTitle}}" has been created successfully.	Your Resume "{{resumeTitle}}" is Ready	Hello {{userName}},\n\nYour resume "{{resumeTitle}}" has been created successfully. You can now download, share, or continue editing it.\n\nBest regards,\nThe ProsumeAI Team	t	["resumeTitle", "userName"]	2025-05-28 23:19:56.5905	2025-05-28 23:19:56.5905
2	cover_letter_created	Cover Letter Created	Your cover letter for {{jobTitle}} at {{company}} has been created.	Cover Letter Created for {{jobTitle}}	Hello {{userName}},\n\nYour cover letter for the {{jobTitle}} position at {{company}} has been created successfully.\n\nBest regards,\nThe ProsumeAI Team	t	["jobTitle", "company", "userName"]	2025-05-28 23:19:56.5905	2025-05-28 23:19:56.5905
3	job_application_created	New Job Application Tracked	Job application for {{jobTitle}} at {{company}} has been added to your tracker.	Job Application Added to Tracker	Hello {{userName}},\n\nYour job application for {{jobTitle}} at {{company}} has been added to your application tracker.\n\nBest regards,\nThe ProsumeAI Team	t	["jobTitle", "company", "userName"]	2025-05-28 23:19:56.5905	2025-05-28 23:19:56.5905
4	subscription_expiring	Subscription Expiring Soon	Your {{planName}} subscription will expire in {{daysLeft}} days.	Your Subscription Expires in {{daysLeft}} Days	Hello {{userName}},\n\nYour {{planName}} subscription will expire in {{daysLeft}} days. Renew now to continue enjoying all premium features.\n\nBest regards,\nThe ProsumeAI Team	t	["planName", "daysLeft", "userName"]	2025-05-28 23:19:56.5905	2025-05-28 23:19:56.5905
5	password_reset	Password Reset Request	A password reset has been requested for your account.	Password Reset Request	Hello {{userName}},\n\nA password reset has been requested for your account. If this was you, please follow the instructions in your email. If not, please contact support.\n\nBest regards,\nThe ProsumeAI Team	t	["userName"]	2025-05-28 23:19:56.5905	2025-05-28 23:19:56.5905
6	system_announcement	System Announcement	{{message}}	{{title}}	Hello {{userName}},\n\n{{message}}\n\nBest regards,\nThe ProsumeAI Team	t	["title", "message", "userName"]	2025-05-28 23:19:56.5905	2025-05-28 23:19:56.5905
7	subscription_activated	Subscription Activated	Your {{planName}} subscription has been activated successfully.	Welcome to {{planName}} - Subscription Activated	Hello {{userName}},\\n\\nYour {{planName}} subscription has been activated successfully! You now have access to all premium features.\\n\\nPlan Details:\\n- Plan: {{planName}}\\n- Amount: {{amount}} {{currency}}\\n- Activation Type: {{activationType}}\\n\\nThank you for choosing ProsumeAI!\\n\\nBest regards,\\nThe ProsumeAI Team	t	["planName", "userName", "amount", "currency", "activationType"]	2025-05-29 01:29:42.793068	2025-05-29 01:29:42.793068
8	subscription_cancelled	Subscription Cancelled	Your subscription has been cancelled. Access will continue until {{endDate}}.	Subscription Cancelled - Access Until {{endDate}}	Hello {{userName}},\\n\\nYour subscription has been cancelled as requested. Don't worry - you'll continue to have access to all premium features until {{endDate}}.\\n\\nIf you change your mind, you can reactivate your subscription anytime from your account settings.\\n\\nBest regards,\\nThe ProsumeAI Team	t	["userName", "endDate", "planName"]	2025-05-29 01:29:42.793068	2025-05-29 01:29:42.793068
9	subscription_grace_period	Subscription in Grace Period	Your subscription has expired but you have {{gracePeriodDays}} days of grace period.	Your Subscription - Grace Period Active	Hello {{userName}},\\n\\nYour subscription has expired, but we've activated a {{gracePeriodDays}}-day grace period for you. This means you can continue using all premium features until {{gracePeriodEnd}}.\\n\\nTo avoid any interruption in service, please update your payment method or renew your subscription.\\n\\nBest regards,\\nThe ProsumeAI Team	t	["userName", "gracePeriodDays", "gracePeriodEnd"]	2025-05-29 01:29:42.793068	2025-05-29 01:29:42.793068
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: raja
--

COPY public.notifications (id, recipient_id, type, title, message, data, is_read, is_system, created_at, expires_at, priority, category, action) FROM stdin;
1	23	resume_created	Resume Created Successfully	Your resume "Software Developer Resume" has been created successfully.	{"resumeTitle": "Software Developer Resume"}	f	f	2025-05-28 23:33:59.078004	\N	normal	resume	\N
2	23	subscription_expiring	Subscription Expiring Soon	Your Pro subscription will expire in 7 days.	{"daysLeft": 7, "planName": "Pro"}	f	f	2025-05-28 23:33:59.082067	\N	high	subscription	\N
3	23	system_announcement	New Feature Available	Check out our new AI-powered cover letter suggestions!	{}	f	t	2025-05-28 23:33:59.082842	\N	normal	system	\N
4	23	account_update	Password Changed	Your account password was successfully updated.	{}	t	f	2025-05-28 23:33:59.083646	\N	normal	account	\N
5	23	system_announcement	Test	This is a test notification	{}	f	t	2025-05-28 23:50:56.196283	\N	high	system	\N
6	24	system_announcement	Test	This is a test notification	{}	f	t	2025-05-28 23:50:56.196283	\N	high	system	\N
7	22	system_announcement	Test	This is a test notification	{}	f	t	2025-05-28 23:50:56.196283	\N	high	system	\N
8	13	system_announcement	Test	This is a test notification	{}	f	t	2025-05-28 23:50:56.196283	\N	high	system	\N
10	20	system_announcement	Test	This is a test notification	{}	f	t	2025-05-28 23:50:56.196283	\N	high	system	\N
11	21	system_announcement	Test	This is a test notification	{}	f	t	2025-05-28 23:50:56.196283	\N	high	system	\N
12	19	system_announcement	Test	This is a test notification	{}	f	t	2025-05-28 23:50:56.196283	\N	high	system	\N
13	28	system_announcement	Test	This is a test notification	{}	f	t	2025-05-28 23:50:56.196283	\N	high	system	\N
15	30	system_announcement	Test	This is a test notification	{}	f	t	2025-05-28 23:50:56.196283	\N	high	system	\N
16	31	system_announcement	Test	This is a test notification	{}	f	t	2025-05-28 23:50:56.196283	\N	high	system	\N
21	23	system_announcement	Test again	Test again for testing	{}	f	t	2025-05-29 00:04:40.335074	\N	normal	system	\N
22	24	system_announcement	Test again	Test again for testing	{}	f	t	2025-05-29 00:04:40.335074	\N	normal	system	\N
23	22	system_announcement	Test again	Test again for testing	{}	f	t	2025-05-29 00:04:40.335074	\N	normal	system	\N
24	13	system_announcement	Test again	Test again for testing	{}	f	t	2025-05-29 00:04:40.335074	\N	normal	system	\N
26	20	system_announcement	Test again	Test again for testing	{}	f	t	2025-05-29 00:04:40.335074	\N	normal	system	\N
27	21	system_announcement	Test again	Test again for testing	{}	f	t	2025-05-29 00:04:40.335074	\N	normal	system	\N
28	19	system_announcement	Test again	Test again for testing	{}	f	t	2025-05-29 00:04:40.335074	\N	normal	system	\N
29	28	system_announcement	Test again	Test again for testing	{}	f	t	2025-05-29 00:04:40.335074	\N	normal	system	\N
31	30	system_announcement	Test again	Test again for testing	{}	f	t	2025-05-29 00:04:40.335074	\N	normal	system	\N
33	31	system_announcement	Test again	Test again for testing	{}	f	t	2025-05-29 00:04:40.335074	\N	normal	system	\N
34	23	system_announcement	Yes it is time 	May this be your time for the update	{}	f	t	2025-05-29 00:19:40.204434	\N	high	system	\N
35	24	system_announcement	Yes it is time 	May this be your time for the update	{}	f	t	2025-05-29 00:19:40.204434	\N	high	system	\N
36	22	system_announcement	Yes it is time 	May this be your time for the update	{}	f	t	2025-05-29 00:19:40.204434	\N	high	system	\N
37	13	system_announcement	Yes it is time 	May this be your time for the update	{}	f	t	2025-05-29 00:19:40.204434	\N	high	system	\N
39	20	system_announcement	Yes it is time 	May this be your time for the update	{}	f	t	2025-05-29 00:19:40.204434	\N	high	system	\N
40	21	system_announcement	Yes it is time 	May this be your time for the update	{}	f	t	2025-05-29 00:19:40.204434	\N	high	system	\N
41	19	system_announcement	Yes it is time 	May this be your time for the update	{}	f	t	2025-05-29 00:19:40.204434	\N	high	system	\N
42	28	system_announcement	Yes it is time 	May this be your time for the update	{}	f	t	2025-05-29 00:19:40.204434	\N	high	system	\N
44	30	system_announcement	Yes it is time 	May this be your time for the update	{}	f	t	2025-05-29 00:19:40.204434	\N	high	system	\N
46	31	system_announcement	Yes it is time 	May this be your time for the update	{}	f	t	2025-05-29 00:19:40.204434	\N	high	system	\N
47	23	system_announcement	Hey get started	Now its time to update your resume 	{}	f	t	2025-05-29 00:30:27.024295	\N	normal	system	\N
48	24	system_announcement	Hey get started	Now its time to update your resume 	{}	f	t	2025-05-29 00:30:27.024295	\N	normal	system	\N
49	22	system_announcement	Hey get started	Now its time to update your resume 	{}	f	t	2025-05-29 00:30:27.024295	\N	normal	system	\N
50	13	system_announcement	Hey get started	Now its time to update your resume 	{}	f	t	2025-05-29 00:30:27.024295	\N	normal	system	\N
52	20	system_announcement	Hey get started	Now its time to update your resume 	{}	f	t	2025-05-29 00:30:27.024295	\N	normal	system	\N
53	21	system_announcement	Hey get started	Now its time to update your resume 	{}	f	t	2025-05-29 00:30:27.024295	\N	normal	system	\N
54	19	system_announcement	Hey get started	Now its time to update your resume 	{}	f	t	2025-05-29 00:30:27.024295	\N	normal	system	\N
55	28	system_announcement	Hey get started	Now its time to update your resume 	{}	f	t	2025-05-29 00:30:27.024295	\N	normal	system	\N
56	30	system_announcement	Hey get started	Now its time to update your resume 	{}	f	t	2025-05-29 00:30:27.024295	\N	normal	system	\N
58	31	system_announcement	Hey get started	Now its time to update your resume 	{}	f	t	2025-05-29 00:30:27.024295	\N	normal	system	\N
57	29	system_announcement	Hey get started	Now its time to update your resume 	{}	t	t	2025-05-29 00:30:27.024295	\N	normal	system	\N
60	23	system_announcement	Time to get started 	Yes get started with our new application	{}	f	t	2025-05-29 00:35:15.091095	\N	normal	system	\N
61	24	system_announcement	Time to get started 	Yes get started with our new application	{}	f	t	2025-05-29 00:35:15.091095	\N	normal	system	\N
62	22	system_announcement	Time to get started 	Yes get started with our new application	{}	f	t	2025-05-29 00:35:15.091095	\N	normal	system	\N
63	13	system_announcement	Time to get started 	Yes get started with our new application	{}	f	t	2025-05-29 00:35:15.091095	\N	normal	system	\N
65	20	system_announcement	Time to get started 	Yes get started with our new application	{}	f	t	2025-05-29 00:35:15.091095	\N	normal	system	\N
66	21	system_announcement	Time to get started 	Yes get started with our new application	{}	f	t	2025-05-29 00:35:15.091095	\N	normal	system	\N
67	19	system_announcement	Time to get started 	Yes get started with our new application	{}	f	t	2025-05-29 00:35:15.091095	\N	normal	system	\N
68	28	system_announcement	Time to get started 	Yes get started with our new application	{}	f	t	2025-05-29 00:35:15.091095	\N	normal	system	\N
69	30	system_announcement	Time to get started 	Yes get started with our new application	{}	f	t	2025-05-29 00:35:15.091095	\N	normal	system	\N
70	29	system_announcement	Time to get started 	Yes get started with our new application	{}	t	t	2025-05-29 00:35:15.091095	\N	normal	system	\N
59	1	system_announcement	Hey get started	Now its time to update your resume 	{}	t	t	2025-05-29 00:30:27.024295	\N	normal	system	\N
71	31	system_announcement	Time to get started 	Yes get started with our new application	{}	f	t	2025-05-29 00:35:15.091095	\N	normal	system	\N
76	29	resume_created	Resume Created Successfully	Your resume "Sandeep Devops" has been created successfully.	{"resumeId": 12, "userName": "sandeepmuppidi", "resumeTitle": "Sandeep Devops"}	t	f	2025-05-29 01:32:42.635153	\N	normal	resume	\N
161	30	system_announcement	Sound Check 	Did you received the sound ?	{}	f	t	2025-06-04 06:59:47.190743	2025-06-11 23:59:00	normal	system	\N
77	29	custom_notification	Resume Updated	Your resume "Sandeep Devops" has been updated successfully.	{"action": "updated", "resumeId": 12, "userName": "sandeepmuppidi", "resumeTitle": "Sandeep Devops"}	t	f	2025-05-29 01:32:48.819373	\N	normal	resume	\N
78	29	custom_notification	Resume Updated	Your resume "Sandeep Devops" has been updated successfully.	{"action": "updated", "resumeId": 12, "userName": "sandeepmuppidi", "resumeTitle": "Sandeep Devops"}	t	f	2025-05-29 01:32:49.640104	\N	normal	resume	\N
79	29	custom_notification	Resume Updated	Your resume "Sandeep Devops" has been updated successfully.	{"action": "updated", "resumeId": 12, "userName": "sandeepmuppidi", "resumeTitle": "Sandeep Devops"}	t	f	2025-05-29 01:32:50.617532	\N	normal	resume	\N
80	22	new_user_registered	New User Registered	Test User (testuser) has registered a new account.	{"email": "test@example.com", "userId": 999, "fullName": "Test User", "username": "testuser", "registrationTime": "2025-05-29T05:45:13.657Z"}	f	f	2025-05-29 01:45:13.681026	\N	normal	admin	\N
82	22	new_subscription	New Subscription	Test User has subscribed to Professional Plan plan for 29.99 USD.	{"amount": "29.99", "userId": 999, "currency": "USD", "planName": "Professional Plan", "userName": "Test User", "subscriptionId": 123, "subscriptionTime": "2025-05-29T05:45:13.685Z"}	f	f	2025-05-29 01:45:13.688134	\N	normal	admin	\N
84	22	payment_received	Payment Received	Payment of 29.99 USD received from Test User for Professional Plan.	{"amount": "29.99", "userId": 999, "currency": "USD", "planName": "Professional Plan", "userName": "Test User", "paymentTime": "2025-05-29T05:45:13.691Z", "transactionId": "txn_test123"}	f	f	2025-05-29 01:45:13.692593	\N	normal	admin	\N
86	22	payment_failed	Payment Failed	Payment failed for Test User - 29.99 USD for Professional Plan. Reason: Insufficient funds	{"amount": "29.99", "reason": "Insufficient funds", "userId": 999, "currency": "USD", "planName": "Professional Plan", "userName": "Test User", "failureTime": "2025-05-29T05:45:13.694Z"}	f	f	2025-05-29 01:45:13.695643	\N	high	admin	\N
88	22	security_alert	Security Alert - Suspicious Login	Multiple failed login attempts detected for user testuser from IP 192.168.1.100	{"userId": 999, "details": {"attempts": 5, "ipAddress": "192.168.1.100", "timeframe": "5 minutes"}, "severity": "high", "userName": "Test User", "alertTime": "2025-05-29T05:45:13.697Z", "alertType": "Suspicious Login"}	f	f	2025-05-29 01:45:13.698839	\N	high	security	\N
72	1	system_announcement	Time to get started 	Yes get started with our new application	{}	t	t	2025-05-29 00:35:15.091095	\N	normal	system	\N
81	1	new_user_registered	New User Registered	Test User (testuser) has registered a new account.	{"email": "test@example.com", "userId": 999, "fullName": "Test User", "username": "testuser", "registrationTime": "2025-05-29T05:45:13.657Z"}	t	f	2025-05-29 01:45:13.684792	\N	normal	admin	\N
83	1	new_subscription	New Subscription	Test User has subscribed to Professional Plan plan for 29.99 USD.	{"amount": "29.99", "userId": 999, "currency": "USD", "planName": "Professional Plan", "userName": "Test User", "subscriptionId": 123, "subscriptionTime": "2025-05-29T05:45:13.685Z"}	t	f	2025-05-29 01:45:13.689997	\N	normal	admin	\N
85	1	payment_received	Payment Received	Payment of 29.99 USD received from Test User for Professional Plan.	{"amount": "29.99", "userId": 999, "currency": "USD", "planName": "Professional Plan", "userName": "Test User", "paymentTime": "2025-05-29T05:45:13.691Z", "transactionId": "txn_test123"}	t	f	2025-05-29 01:45:13.693994	\N	normal	admin	\N
87	1	payment_failed	Payment Failed	Payment failed for Test User - 29.99 USD for Professional Plan. Reason: Insufficient funds	{"amount": "29.99", "reason": "Insufficient funds", "userId": 999, "currency": "USD", "planName": "Professional Plan", "userName": "Test User", "failureTime": "2025-05-29T05:45:13.694Z"}	t	f	2025-05-29 01:45:13.696786	\N	high	admin	\N
89	1	security_alert	Security Alert - Suspicious Login	Multiple failed login attempts detected for user testuser from IP 192.168.1.100	{"userId": 999, "details": {"attempts": 5, "ipAddress": "192.168.1.100", "timeframe": "5 minutes"}, "severity": "high", "userName": "Test User", "alertTime": "2025-05-29T05:45:13.697Z", "alertType": "Suspicious Login"}	t	f	2025-05-29 01:45:13.700184	\N	high	security	\N
90	22	new_user_registered	New User Registered	Test User (testuser) has registered a new account.	{"email": "test@example.com", "userId": 999, "fullName": "Test User", "username": "testuser", "registrationTime": "2025-05-29T05:48:25.685Z"}	f	f	2025-05-29 01:48:25.709474	\N	normal	admin	\N
92	22	new_subscription	New Subscription	Test User has subscribed to Professional Plan plan for 29.99 USD.	{"amount": "29.99", "userId": 999, "currency": "USD", "planName": "Professional Plan", "userName": "Test User", "subscriptionId": 1, "subscriptionTime": "2025-05-29T05:48:25.713Z"}	f	f	2025-05-29 01:48:25.716132	\N	normal	admin	\N
94	22	payment_received	Payment Received	Payment of 29.99 USD received from Test User for Professional Plan.	{"amount": "29.99", "userId": 999, "currency": "USD", "planName": "Professional Plan", "userName": "Test User", "paymentTime": "2025-05-29T05:48:25.718Z", "transactionId": "pay_test123"}	f	f	2025-05-29 01:48:25.720206	\N	normal	admin	\N
96	22	security_alert	Security Alert - Multiple Failed Login Attempts	User attempted to login 5 times with wrong password	{"userId": 999, "details": {"attempts": 5, "ipAddress": "192.168.1.100"}, "severity": "high", "userName": "Test User", "alertTime": "2025-05-29T05:48:25.722Z", "alertType": "Multiple Failed Login Attempts"}	f	f	2025-05-29 01:48:25.723106	\N	high	security	\N
98	22	server_error	Server Error	Error on GET /api/resumes: Database connection timeout	{"error": "Database connection timeout", "method": "GET", "userId": 999, "endpoint": "/api/resumes", "userName": "Test User", "errorTime": "2025-05-29T05:48:25.724Z"}	f	f	2025-05-29 01:48:25.726215	\N	high	system	\N
100	22	new_user_registered	New User Registered	Sanskruti Kavatkar (ksanskrutee@gmail.com) has registered a new account.	{"email": "ksanskrutee@gmail.com", "userId": 32, "fullName": "Sanskruti Kavatkar", "username": "ksanskrutee@gmail.com", "registrationTime": "2025-05-29T20:41:52.122Z"}	f	f	2025-05-29 16:41:52.125913	\N	normal	admin	\N
102	32	subscription_activated	Subscription Activated	Your Entry subscription has been activated successfully.	{"planId": 8, "planName": "Entry", "planType": "free", "activationType": "freemium_activation", "subscriptionId": 36}	f	f	2025-05-29 16:47:51.719792	\N	normal	subscription	\N
103	32	resume_created	Resume Created Successfully	Your resume "Sanskruti Mars.INC " has been created successfully.	{"resumeId": 13, "userName": "ksanskrutee@gmail.com", "resumeTitle": "Sanskruti Mars.INC "}	f	f	2025-05-29 16:49:08.509547	\N	normal	resume	\N
104	32	custom_notification	Resume Updated	Your resume "Sanskruti Mars.INC " has been updated successfully.	{"action": "updated", "resumeId": 13, "userName": "ksanskrutee@gmail.com", "resumeTitle": "Sanskruti Mars.INC "}	f	f	2025-05-29 16:55:37.10873	\N	normal	resume	\N
105	23	system_announcement	Luck Is Your's	We're excited to have you on board. Wishing you the very best in your job search journey let’s land that dream role together!	{}	f	t	2025-05-29 17:00:39.016321	\N	normal	system	\N
106	24	system_announcement	Luck Is Your's	We're excited to have you on board. Wishing you the very best in your job search journey let’s land that dream role together!	{}	f	t	2025-05-29 17:00:39.016321	\N	normal	system	\N
162	29	system_announcement	Sound Check 	Did you received the sound ?	{}	f	t	2025-06-04 06:59:47.190743	2025-06-11 23:59:00	normal	system	\N
107	22	system_announcement	Luck Is Your's	We're excited to have you on board. Wishing you the very best in your job search journey let’s land that dream role together!	{}	f	t	2025-05-29 17:00:39.016321	\N	normal	system	\N
108	13	system_announcement	Luck Is Your's	We're excited to have you on board. Wishing you the very best in your job search journey let’s land that dream role together!	{}	f	t	2025-05-29 17:00:39.016321	\N	normal	system	\N
110	20	system_announcement	Luck Is Your's	We're excited to have you on board. Wishing you the very best in your job search journey let’s land that dream role together!	{}	f	t	2025-05-29 17:00:39.016321	\N	normal	system	\N
111	21	system_announcement	Luck Is Your's	We're excited to have you on board. Wishing you the very best in your job search journey let’s land that dream role together!	{}	f	t	2025-05-29 17:00:39.016321	\N	normal	system	\N
112	19	system_announcement	Luck Is Your's	We're excited to have you on board. Wishing you the very best in your job search journey let’s land that dream role together!	{}	f	t	2025-05-29 17:00:39.016321	\N	normal	system	\N
113	28	system_announcement	Luck Is Your's	We're excited to have you on board. Wishing you the very best in your job search journey let’s land that dream role together!	{}	f	t	2025-05-29 17:00:39.016321	\N	normal	system	\N
114	30	system_announcement	Luck Is Your's	We're excited to have you on board. Wishing you the very best in your job search journey let’s land that dream role together!	{}	f	t	2025-05-29 17:00:39.016321	\N	normal	system	\N
115	29	system_announcement	Luck Is Your's	We're excited to have you on board. Wishing you the very best in your job search journey let’s land that dream role together!	{}	f	t	2025-05-29 17:00:39.016321	\N	normal	system	\N
116	31	system_announcement	Luck Is Your's	We're excited to have you on board. Wishing you the very best in your job search journey let’s land that dream role together!	{}	f	t	2025-05-29 17:00:39.016321	\N	normal	system	\N
117	32	system_announcement	Luck Is Your's	We're excited to have you on board. Wishing you the very best in your job search journey let’s land that dream role together!	{}	f	t	2025-05-29 17:00:39.016321	\N	normal	system	\N
91	1	new_user_registered	New User Registered	Test User (testuser) has registered a new account.	{"email": "test@example.com", "userId": 999, "fullName": "Test User", "username": "testuser", "registrationTime": "2025-05-29T05:48:25.685Z"}	t	f	2025-05-29 01:48:25.712536	\N	normal	admin	\N
93	1	new_subscription	New Subscription	Test User has subscribed to Professional Plan plan for 29.99 USD.	{"amount": "29.99", "userId": 999, "currency": "USD", "planName": "Professional Plan", "userName": "Test User", "subscriptionId": 1, "subscriptionTime": "2025-05-29T05:48:25.713Z"}	t	f	2025-05-29 01:48:25.718117	\N	normal	admin	\N
95	1	payment_received	Payment Received	Payment of 29.99 USD received from Test User for Professional Plan.	{"amount": "29.99", "userId": 999, "currency": "USD", "planName": "Professional Plan", "userName": "Test User", "paymentTime": "2025-05-29T05:48:25.718Z", "transactionId": "pay_test123"}	t	f	2025-05-29 01:48:25.721409	\N	normal	admin	\N
97	1	security_alert	Security Alert - Multiple Failed Login Attempts	User attempted to login 5 times with wrong password	{"userId": 999, "details": {"attempts": 5, "ipAddress": "192.168.1.100"}, "severity": "high", "userName": "Test User", "alertTime": "2025-05-29T05:48:25.722Z", "alertType": "Multiple Failed Login Attempts"}	t	f	2025-05-29 01:48:25.724292	\N	high	security	\N
99	1	server_error	Server Error	Error on GET /api/resumes: Database connection timeout	{"error": "Database connection timeout", "method": "GET", "userId": 999, "endpoint": "/api/resumes", "userName": "Test User", "errorTime": "2025-05-29T05:48:25.724Z"}	t	f	2025-05-29 01:48:25.727568	\N	high	system	\N
101	1	new_user_registered	New User Registered	Sanskruti Kavatkar (ksanskrutee@gmail.com) has registered a new account.	{"email": "ksanskrutee@gmail.com", "userId": 32, "fullName": "Sanskruti Kavatkar", "username": "ksanskrutee@gmail.com", "registrationTime": "2025-05-29T20:41:52.122Z"}	t	f	2025-05-29 16:41:52.129573	\N	normal	admin	\N
118	1	system_announcement	Luck Is Your's	We're excited to have you on board. Wishing you the very best in your job search journey let’s land that dream role together!	{}	t	t	2025-05-29 17:00:39.016321	\N	normal	system	\N
119	1	custom_notification	Resume Updated	Your resume "Behavioral Health Analyst" has been updated successfully.	{"action": "updated", "resumeId": 10, "userName": "rajamuppidi", "resumeTitle": "Behavioral Health Analyst"}	t	f	2025-05-30 00:43:59.53301	\N	normal	resume	\N
120	1	custom_notification	Resume Updated	Your resume "Guy Hembroff" has been updated successfully.	{"action": "updated", "resumeId": 6, "userName": "rajamuppidi", "resumeTitle": "Guy Hembroff"}	t	f	2025-05-30 04:03:22.156968	\N	normal	resume	\N
121	1	custom_notification	Resume Updated	Your resume "Guy Hembroff" has been updated successfully.	{"action": "updated", "resumeId": 6, "userName": "rajamuppidi", "resumeTitle": "Guy Hembroff"}	t	f	2025-05-30 04:07:29.227408	\N	normal	resume	\N
122	1	custom_notification	Resume Updated	Your resume "Guy Hembroff" has been updated successfully.	{"action": "updated", "resumeId": 6, "userName": "rajamuppidi", "resumeTitle": "Guy Hembroff"}	t	f	2025-05-30 04:08:12.765004	\N	normal	resume	\N
123	1	custom_notification	Resume Updated	Your resume "Guy Hembroff" has been updated successfully.	{"action": "updated", "resumeId": 6, "userName": "rajamuppidi", "resumeTitle": "Guy Hembroff"}	t	f	2025-05-30 05:37:48.514367	\N	normal	resume	\N
124	1	resume_created	Resume Created Successfully	Your resume "Data Analyst Healthcare Operations" has been created successfully.	{"resumeId": 14, "userName": "rajamuppidi", "resumeTitle": "Data Analyst Healthcare Operations"}	t	f	2025-05-30 18:34:19.778805	\N	normal	resume	\N
125	1	custom_notification	Resume Updated	Your resume "Data Analyst Healthcare Operations" has been updated successfully.	{"action": "updated", "resumeId": 14, "userName": "rajamuppidi", "resumeTitle": "Data Analyst Healthcare Operations"}	t	f	2025-05-30 18:51:18.695219	\N	normal	resume	\N
126	1	custom_notification	Resume Updated	Your resume "Data Analyst Healthcare Operations" has been updated successfully.	{"action": "updated", "resumeId": 14, "userName": "rajamuppidi", "resumeTitle": "Data Analyst Healthcare Operations"}	t	f	2025-05-30 18:54:39.377383	\N	normal	resume	\N
127	1	custom_notification	Resume Updated	Your resume "Guy Hembroff" has been updated successfully.	{"action": "updated", "resumeId": 6, "userName": "rajamuppidi", "resumeTitle": "Guy Hembroff"}	t	f	2025-05-30 19:46:56.969211	\N	normal	resume	\N
128	1	custom_notification	Resume Updated	Your resume "Guy Hembroff" has been updated successfully.	{"action": "updated", "resumeId": 6, "userName": "rajamuppidi", "resumeTitle": "Guy Hembroff"}	t	f	2025-05-30 19:47:21.411603	\N	normal	resume	\N
129	1	custom_notification	Resume Updated	Your resume "Guy Hembroff" has been updated successfully.	{"action": "updated", "resumeId": 6, "userName": "rajamuppidi", "resumeTitle": "Guy Hembroff"}	t	f	2025-05-30 19:54:53.14536	\N	normal	resume	\N
109	18	system_announcement	Luck Is Your's	We're excited to have you on board. Wishing you the very best in your job search journey let’s land that dream role together!	{}	t	t	2025-05-29 17:00:39.016321	\N	normal	system	\N
130	1	cover_letter_created	Cover Letter Created	Your cover letter for Data Analyst – Healthcare Operations at Harmony Health Systems has been created.	{"company": "Harmony Health Systems", "jobTitle": "Data Analyst – Healthcare Operations", "userName": "rajamuppidi", "coverLetterId": 9, "coverLetterTitle": "Data Analyst"}	t	f	2025-05-31 04:39:58.403348	\N	normal	cover_letter	\N
131	1	custom_notification	Cover Letter Updated	Your cover letter "Data Analyst" has been updated successfully.	{"action": "updated", "company": "Harmony Health Systems", "jobTitle": "Data Analyst – Healthcare Operations", "userName": "rajamuppidi", "coverLetterId": 9, "coverLetterTitle": "Data Analyst"}	t	f	2025-05-31 04:40:14.431905	\N	normal	cover_letter	\N
132	1	cover_letter_created	Cover Letter Created	Your cover letter for Data Analyst – Healthcare Operations at Harmony Health Systems has been created.	{"company": "Harmony Health Systems", "jobTitle": "Data Analyst – Healthcare Operations", "userName": "rajamuppidi", "coverLetterId": 10, "coverLetterTitle": "Data Analyst"}	t	f	2025-05-31 04:44:29.262625	\N	normal	cover_letter	\N
133	1	custom_notification	Cover Letter Updated	Your cover letter "Data Analyst" has been updated successfully.	{"action": "updated", "company": "Harmony Health Systems", "jobTitle": "Data Analyst – Healthcare Operations", "userName": "rajamuppidi", "coverLetterId": 9, "coverLetterTitle": "Data Analyst"}	t	f	2025-05-31 04:46:08.272045	\N	normal	cover_letter	\N
134	1	resume_created	Resume Created Successfully	Your resume "Testing resume upload" has been created successfully.	{"resumeId": 15, "userName": "rajamuppidi", "resumeTitle": "Testing resume upload"}	t	f	2025-05-31 17:11:32.528104	\N	normal	resume	\N
135	1	custom_notification	Resume Updated	Your resume "Data Analyst Healthcare Operations" has been updated successfully.	{"action": "updated", "resumeId": 14, "userName": "rajamuppidi", "resumeTitle": "Data Analyst Healthcare Operations"}	t	f	2025-06-04 01:44:03.078488	\N	normal	resume	\N
136	1	custom_notification	Resume Updated	Your resume "Data Analyst Healthcare Operations" has been updated successfully.	{"action": "updated", "resumeId": 14, "userName": "rajamuppidi", "resumeTitle": "Data Analyst Healthcare Operations"}	t	f	2025-06-04 01:44:53.922617	\N	normal	resume	\N
138	23	system_announcement	Testing Docker	This is a test notification for the docker 	{}	f	t	2025-06-04 01:46:14.466151	2025-06-05 18:46:00	high	system	\N
139	24	system_announcement	Testing Docker	This is a test notification for the docker 	{}	f	t	2025-06-04 01:46:14.466151	2025-06-05 18:46:00	high	system	\N
140	22	system_announcement	Testing Docker	This is a test notification for the docker 	{}	f	t	2025-06-04 01:46:14.466151	2025-06-05 18:46:00	high	system	\N
141	13	system_announcement	Testing Docker	This is a test notification for the docker 	{}	f	t	2025-06-04 01:46:14.466151	2025-06-05 18:46:00	high	system	\N
143	20	system_announcement	Testing Docker	This is a test notification for the docker 	{}	f	t	2025-06-04 01:46:14.466151	2025-06-05 18:46:00	high	system	\N
144	21	system_announcement	Testing Docker	This is a test notification for the docker 	{}	f	t	2025-06-04 01:46:14.466151	2025-06-05 18:46:00	high	system	\N
145	19	system_announcement	Testing Docker	This is a test notification for the docker 	{}	f	t	2025-06-04 01:46:14.466151	2025-06-05 18:46:00	high	system	\N
146	28	system_announcement	Testing Docker	This is a test notification for the docker 	{}	f	t	2025-06-04 01:46:14.466151	2025-06-05 18:46:00	high	system	\N
147	30	system_announcement	Testing Docker	This is a test notification for the docker 	{}	f	t	2025-06-04 01:46:14.466151	2025-06-05 18:46:00	high	system	\N
148	29	system_announcement	Testing Docker	This is a test notification for the docker 	{}	f	t	2025-06-04 01:46:14.466151	2025-06-05 18:46:00	high	system	\N
149	31	system_announcement	Testing Docker	This is a test notification for the docker 	{}	f	t	2025-06-04 01:46:14.466151	2025-06-05 18:46:00	high	system	\N
150	32	system_announcement	Testing Docker	This is a test notification for the docker 	{}	f	t	2025-06-04 01:46:14.466151	2025-06-05 18:46:00	high	system	\N
137	1	custom_notification	Resume Updated	Your resume "Guy Hembroff" has been updated successfully.	{"action": "updated", "resumeId": 6, "userName": "rajamuppidi", "resumeTitle": "Guy Hembroff"}	t	f	2025-06-04 01:45:07.298998	\N	normal	resume	\N
151	1	system_announcement	Testing Docker	This is a test notification for the docker 	{}	t	t	2025-06-04 01:46:14.466151	2025-06-05 18:46:00	high	system	\N
152	23	system_announcement	Sound Check 	Did you received the sound ?	{}	f	t	2025-06-04 06:59:47.190743	2025-06-11 23:59:00	normal	system	\N
153	24	system_announcement	Sound Check 	Did you received the sound ?	{}	f	t	2025-06-04 06:59:47.190743	2025-06-11 23:59:00	normal	system	\N
154	22	system_announcement	Sound Check 	Did you received the sound ?	{}	f	t	2025-06-04 06:59:47.190743	2025-06-11 23:59:00	normal	system	\N
155	13	system_announcement	Sound Check 	Did you received the sound ?	{}	f	t	2025-06-04 06:59:47.190743	2025-06-11 23:59:00	normal	system	\N
157	20	system_announcement	Sound Check 	Did you received the sound ?	{}	f	t	2025-06-04 06:59:47.190743	2025-06-11 23:59:00	normal	system	\N
158	21	system_announcement	Sound Check 	Did you received the sound ?	{}	f	t	2025-06-04 06:59:47.190743	2025-06-11 23:59:00	normal	system	\N
159	19	system_announcement	Sound Check 	Did you received the sound ?	{}	f	t	2025-06-04 06:59:47.190743	2025-06-11 23:59:00	normal	system	\N
160	28	system_announcement	Sound Check 	Did you received the sound ?	{}	f	t	2025-06-04 06:59:47.190743	2025-06-11 23:59:00	normal	system	\N
142	18	system_announcement	Testing Docker	This is a test notification for the docker 	{}	t	t	2025-06-04 01:46:14.466151	2025-06-05 18:46:00	high	system	\N
156	18	system_announcement	Sound Check 	Did you received the sound ?	{}	t	t	2025-06-04 06:59:47.190743	2025-06-11 23:59:00	normal	system	\N
163	31	system_announcement	Sound Check 	Did you received the sound ?	{}	f	t	2025-06-04 06:59:47.190743	2025-06-11 23:59:00	normal	system	\N
164	32	system_announcement	Sound Check 	Did you received the sound ?	{}	f	t	2025-06-04 06:59:47.190743	2025-06-11 23:59:00	normal	system	\N
165	1	system_announcement	Sound Check 	Did you received the sound ?	{}	t	t	2025-06-04 06:59:47.190743	2025-06-11 23:59:00	normal	system	\N
166	23	system_announcement	Realtime Check	Checking the real time notification fetch in the dropdown 	{}	f	t	2025-06-04 07:05:15.469398	\N	high	system	\N
167	24	system_announcement	Realtime Check	Checking the real time notification fetch in the dropdown 	{}	f	t	2025-06-04 07:05:15.469398	\N	high	system	\N
168	22	system_announcement	Realtime Check	Checking the real time notification fetch in the dropdown 	{}	f	t	2025-06-04 07:05:15.469398	\N	high	system	\N
169	13	system_announcement	Realtime Check	Checking the real time notification fetch in the dropdown 	{}	f	t	2025-06-04 07:05:15.469398	\N	high	system	\N
171	20	system_announcement	Realtime Check	Checking the real time notification fetch in the dropdown 	{}	f	t	2025-06-04 07:05:15.469398	\N	high	system	\N
172	21	system_announcement	Realtime Check	Checking the real time notification fetch in the dropdown 	{}	f	t	2025-06-04 07:05:15.469398	\N	high	system	\N
173	19	system_announcement	Realtime Check	Checking the real time notification fetch in the dropdown 	{}	f	t	2025-06-04 07:05:15.469398	\N	high	system	\N
174	28	system_announcement	Realtime Check	Checking the real time notification fetch in the dropdown 	{}	f	t	2025-06-04 07:05:15.469398	\N	high	system	\N
175	30	system_announcement	Realtime Check	Checking the real time notification fetch in the dropdown 	{}	f	t	2025-06-04 07:05:15.469398	\N	high	system	\N
176	29	system_announcement	Realtime Check	Checking the real time notification fetch in the dropdown 	{}	f	t	2025-06-04 07:05:15.469398	\N	high	system	\N
177	31	system_announcement	Realtime Check	Checking the real time notification fetch in the dropdown 	{}	f	t	2025-06-04 07:05:15.469398	\N	high	system	\N
178	32	system_announcement	Realtime Check	Checking the real time notification fetch in the dropdown 	{}	f	t	2025-06-04 07:05:15.469398	\N	high	system	\N
179	1	system_announcement	Realtime Check	Checking the real time notification fetch in the dropdown 	{}	t	t	2025-06-04 07:05:15.469398	\N	high	system	\N
180	23	system_announcement	Check again	Checking again	{}	f	t	2025-06-04 07:06:35.16222	\N	high	system	\N
181	24	system_announcement	Check again	Checking again	{}	f	t	2025-06-04 07:06:35.16222	\N	high	system	\N
182	22	system_announcement	Check again	Checking again	{}	f	t	2025-06-04 07:06:35.16222	\N	high	system	\N
183	13	system_announcement	Check again	Checking again	{}	f	t	2025-06-04 07:06:35.16222	\N	high	system	\N
185	20	system_announcement	Check again	Checking again	{}	f	t	2025-06-04 07:06:35.16222	\N	high	system	\N
186	21	system_announcement	Check again	Checking again	{}	f	t	2025-06-04 07:06:35.16222	\N	high	system	\N
187	19	system_announcement	Check again	Checking again	{}	f	t	2025-06-04 07:06:35.16222	\N	high	system	\N
188	28	system_announcement	Check again	Checking again	{}	f	t	2025-06-04 07:06:35.16222	\N	high	system	\N
189	30	system_announcement	Check again	Checking again	{}	f	t	2025-06-04 07:06:35.16222	\N	high	system	\N
190	29	system_announcement	Check again	Checking again	{}	f	t	2025-06-04 07:06:35.16222	\N	high	system	\N
191	31	system_announcement	Check again	Checking again	{}	f	t	2025-06-04 07:06:35.16222	\N	high	system	\N
192	32	system_announcement	Check again	Checking again	{}	f	t	2025-06-04 07:06:35.16222	\N	high	system	\N
193	1	system_announcement	Check again	Checking again	{}	t	t	2025-06-04 07:06:35.16222	\N	high	system	\N
194	23	system_announcement	FInal Notification Check	real time check	{}	f	t	2025-06-04 07:09:46.0679	\N	normal	system	\N
195	24	system_announcement	FInal Notification Check	real time check	{}	f	t	2025-06-04 07:09:46.0679	\N	normal	system	\N
196	22	system_announcement	FInal Notification Check	real time check	{}	f	t	2025-06-04 07:09:46.0679	\N	normal	system	\N
197	13	system_announcement	FInal Notification Check	real time check	{}	f	t	2025-06-04 07:09:46.0679	\N	normal	system	\N
199	20	system_announcement	FInal Notification Check	real time check	{}	f	t	2025-06-04 07:09:46.0679	\N	normal	system	\N
200	21	system_announcement	FInal Notification Check	real time check	{}	f	t	2025-06-04 07:09:46.0679	\N	normal	system	\N
201	19	system_announcement	FInal Notification Check	real time check	{}	f	t	2025-06-04 07:09:46.0679	\N	normal	system	\N
202	28	system_announcement	FInal Notification Check	real time check	{}	f	t	2025-06-04 07:09:46.0679	\N	normal	system	\N
203	30	system_announcement	FInal Notification Check	real time check	{}	f	t	2025-06-04 07:09:46.0679	\N	normal	system	\N
204	29	system_announcement	FInal Notification Check	real time check	{}	f	t	2025-06-04 07:09:46.0679	\N	normal	system	\N
205	31	system_announcement	FInal Notification Check	real time check	{}	f	t	2025-06-04 07:09:46.0679	\N	normal	system	\N
206	32	system_announcement	FInal Notification Check	real time check	{}	f	t	2025-06-04 07:09:46.0679	\N	normal	system	\N
207	1	system_announcement	FInal Notification Check	real time check	{}	t	t	2025-06-04 07:09:46.0679	\N	normal	system	\N
209	22	new_subscription	New Subscription	sandeep has subscribed to Elite plan for 29.99 USD.	{"amount": "29.99", "userId": 18, "currency": "USD", "planName": "Elite", "userName": "sandeep", "subscriptionId": 38, "subscriptionTime": "2025-06-04T07:18:39.121Z"}	f	f	2025-06-04 07:18:39.123953	\N	normal	admin	\N
208	18	subscription_activated	Subscription Activated	Your Elite subscription has been activated successfully.	{"amount": "29.99", "planId": 6, "currency": "USD", "planName": "Elite", "planType": "paid", "activationType": "paid_activation", "subscriptionId": 38}	t	f	2025-06-04 07:18:39.119993	\N	normal	subscription	\N
198	18	system_announcement	FInal Notification Check	real time check	{}	t	t	2025-06-04 07:09:46.0679	\N	normal	system	\N
184	18	system_announcement	Check again	Checking again	{}	t	t	2025-06-04 07:06:35.16222	\N	high	system	\N
9	18	system_announcement	Test	This is a test notification	{}	t	t	2025-05-28 23:50:56.196283	\N	high	system	\N
25	18	system_announcement	Test again	Test again for testing	{}	t	t	2025-05-29 00:04:40.335074	\N	normal	system	\N
38	18	system_announcement	Yes it is time 	May this be your time for the update	{}	t	t	2025-05-29 00:19:40.204434	\N	high	system	\N
51	18	system_announcement	Hey get started	Now its time to update your resume 	{}	t	t	2025-05-29 00:30:27.024295	\N	normal	system	\N
64	18	system_announcement	Time to get started 	Yes get started with our new application	{}	t	t	2025-05-29 00:35:15.091095	\N	normal	system	\N
170	18	system_announcement	Realtime Check	Checking the real time notification fetch in the dropdown 	{}	t	t	2025-06-04 07:05:15.469398	\N	high	system	\N
210	1	new_subscription	New Subscription	sandeep has subscribed to Elite plan for 29.99 USD.	{"amount": "29.99", "userId": 18, "currency": "USD", "planName": "Elite", "userName": "sandeep", "subscriptionId": 38, "subscriptionTime": "2025-06-04T07:18:39.121Z"}	t	f	2025-06-04 07:18:39.126906	\N	normal	admin	\N
\.


--
-- Data for Name: payment_gateway_configs; Type: TABLE DATA; Schema: public; Owner: raja
--

COPY public.payment_gateway_configs (id, name, service, key, is_active, is_default, config_options, last_used, test_mode, created_at, updated_at) FROM stdin;
1	test razorpay	RAZORPAY	rzp_test_1l154BvOcZYlRW:bFsyMQQn3EEi0TfjVDSUJxjb	f	f	{"plan_mappings": {"5": "plan_QV0y6l1ibfvlUm"}}	2025-05-15 00:59:59.438	t	2025-04-28 02:55:06.364367	2025-05-15 01:01:06.917
6	Test Razorpay	RAZORPAY	rzp_test_OWN5HeRiAYpuCq:RwS8Lq7km15tsXxqkfiJSFhq	t	f	{"plan_mappings": {"4": {"INR": "plan_QWzYrcGanrK9Dk", "USD": "plan_QWzYqgAalItsWC"}, "5": {"INR": "plan_QWzYvmwiewQ007", "USD": "plan_QWzYungULdbIAi"}, "6": {"INR": "plan_QWzZ5C5J5x5o9P", "USD": "plan_QWzZ4D3QDlphnW"}, "4_INR": "plan_QWzY0oglySbHtK", "4_USD": "plan_QXLTPLSMCWpxXT", "5_USD": {"INR": "plan_QV1KqZLJoubWoW"}, "6_INR": "plan_QXO7hBx3yRNFhz", "6_USD": "plan_QWzjvAEel8BdB5"}}	2025-06-04 19:59:53.808	t	2025-05-14 21:04:32.375505	2025-06-04 19:59:53.808
\.


--
-- Data for Name: payment_methods; Type: TABLE DATA; Schema: public; Owner: raja
--

COPY public.payment_methods (id, user_id, gateway, type, last_four, expiry_month, expiry_year, gateway_payment_method_id, is_default, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: payment_transactions; Type: TABLE DATA; Schema: public; Owner: raja
--

COPY public.payment_transactions (id, user_id, subscription_id, amount, currency, gateway, gateway_transaction_id, status, refund_reason, refund_amount, created_at, updated_at, paypal_order_id, paypal_payer_id, metadata) FROM stdin;
15	18	20	0.50	USD	RAZORPAY	pay_QUxdX8AvmqSe4t	COMPLETED	AUTHENTICATION_CHARGE: Authentication payment for subscription. Plan: Starter, actual_plan_amount: 9.99, plan_currency: USD, transaction_currency: INR, is_auth_charge: true	\N	2025-05-14 17:41:23.607698	2025-05-14 17:41:23.607698	\N	\N	\N
31	28	32	9.99	USD	RAZORPAY	pay_QXLV7TsvCnTkvR	COMPLETED	Initial subscription payment for Starter plan	\N	2025-05-20 18:20:05.564347	2025-05-20 22:41:30.845	\N	\N	{"isUpgrade": false, "userRegion": "GLOBAL", "planDetails": {"id": 4, "name": "Starter", "cycle": "MONTHLY"}, "userCountry": "US", "paymentDetails": {"actualCurrency": "INR", "correctPlanPrice": "9.99", "expectedCurrency": "USD", "correctPlanCurrency": "USD", "hasCurrencyMismatch": true}}
23	20	25	0.00	USD	RAZORPAY	pay_QV1WoyCgCY23iO	COMPLETED	SUBSCRIPTION_PAYMENT: plan_name: Pro, plan_cycle: MONTHLY, payment_type: subscription, actual_plan_amount: 29.99, plan_currency: USD, transaction_currency: USD, expected_currency: USD	\N	2025-05-14 21:29:50.761601	2025-05-14 21:29:50.761601	\N	\N	{"isUpgrade": false, "userRegion": "GLOBAL", "planDetails": {"id": 5, "name": "Unknown Plan", "cycle": "MONTHLY"}, "userCountry": "US", "paymentDetails": {"actualCurrency": "USD", "correctPlanPrice": "29.99", "expectedCurrency": "USD", "correctPlanCurrency": "USD", "hasCurrencyMismatch": false}}
26	23	27	0.00	USD	NONE	freemium_1747377612398	COMPLETED	\N	\N	2025-05-16 06:40:12.383	2025-05-16 06:40:12.383	\N	\N	{"planId": 8, "planName": "Entry", "freemiumActivation": true}
27	24	28	0.00	USD	NONE	freemium_1747523776865	COMPLETED	\N	\N	2025-05-17 23:16:16.843	2025-05-17 23:16:16.843	\N	\N	{"planId": 8, "planName": "Entry", "freemiumActivation": true}
18	19	22	29.99	USD	RAZORPAY	pay_QUzyDXFYk9GOBm	COMPLETED	New subscription payment. Full price for Elite plan (no proration).	\N	2025-05-14 19:58:24.31723	2025-05-20 22:43:32.327	\N	\N	{"fixedBy": "admin-sql-fix", "userRegion": "GLOBAL", "description": "Payment with currency mismatch. User charged in INR instead of USD.", "planDetails": {"id": 6, "name": "Elite", "cycle": "MONTHLY"}, "userCountry": "US", "paymentDetails": {"actualCurrency": "INR", "correctPlanPrice": 49.99, "expectedCurrency": "USD", "correctPlanCurrency": "USD", "hasCurrencyMismatch": true}}
34	31	35	0.00	USD	NONE	freemium_1747990403726	COMPLETED	\N	\N	2025-05-23 08:53:23.715	2025-05-23 08:53:23.715	\N	\N	{"planId": 8, "planName": "Entry", "freemiumActivation": true}
24	21	26	49.99	USD	RAZORPAY	pay_QVIGtXTXkm93W8	COMPLETED	Initial subscription payment for Elite plan	\N	2025-05-15 13:52:32.909199	2025-05-20 22:43:32.331	\N	\N	\N
33	29	34	2499.00	INR	RAZORPAY	pay_QXOKdNQ3l8lNIY	COMPLETED	Initial subscription payment for Elite plan	\N	2025-05-20 21:06:10.983159	2025-05-20 21:06:10.983159	\N	\N	{"isUpgrade": false, "userRegion": "INDIA", "planDetails": {"id": 6, "name": "Elite", "cycle": "MONTHLY"}, "userCountry": "IN", "paymentDetails": {"actualCurrency": "INR", "correctPlanPrice": "2499.00", "expectedCurrency": "INR", "correctPlanCurrency": "INR", "hasCurrencyMismatch": false}}
35	32	36	0.00	USD	NONE	freemium_1748551671714	COMPLETED	\N	\N	2025-05-29 20:47:51.684	2025-05-29 20:47:51.684	\N	\N	{"planId": 8, "planName": "Entry", "freemiumActivation": true}
22	20	25	19.99	USD	RAZORPAY	pay_QV1WoyCgCY23iO	COMPLETED	Initial subscription payment for Pro plan	\N	2025-05-14 21:29:50.756473	2025-05-20 22:41:30.833	\N	\N	\N
16	19	21	19.99	USD	RAZORPAY	pay_QUz7cgb4CnzN9N	COMPLETED	\N	\N	2025-05-14 19:08:34.016204	2025-05-20 22:41:30.84	\N	\N	{"fixedBy": "admin-sql-fix", "userRegion": "GLOBAL", "description": "Payment with currency mismatch. User charged in INR instead of USD.", "planDetails": {"id": 5, "name": "Pro", "cycle": "MONTHLY"}, "userCountry": "US", "paymentDetails": {"actualCurrency": "INR", "correctPlanPrice": 29.99, "expectedCurrency": "USD", "correctPlanCurrency": "USD", "hasCurrencyMismatch": true}}
20	19	24	29.99	USD	RAZORPAY	pay_QV05q44fHQzL1q	COMPLETED	New subscription payment. Full price for Elite plan (no proration).	\N	2025-05-14 20:05:34.952423	2025-05-20 22:43:32.336	\N	\N	{"fixedBy": "admin-sql-fix", "userRegion": "GLOBAL", "description": "Payment with currency mismatch. User charged in INR instead of USD.", "planDetails": {"id": 6, "name": "Elite", "cycle": "MONTHLY"}, "userCountry": "US", "paymentDetails": {"actualCurrency": "INR", "correctPlanPrice": 49.99, "expectedCurrency": "USD", "correctPlanCurrency": "USD", "hasCurrencyMismatch": true}}
25	21	26	29.99	USD	RAZORPAY	pay_QVILKDuy9v6ovq	COMPLETED	SUBSCRIPTION_PAYMENT: plan_name: Elite, plan_cycle: MONTHLY, payment_type: subscription, actual_plan_amount: 49.99, plan_currency: USD, original_note: Invoice inv_QVILIg5NoIsAKS for billing period 2025-06-14 to 2025-07-14	\N	2025-05-15 16:21:34.996834	2025-05-20 22:43:32.339	\N	\N	\N
36	18	38	29.99	USD	RAZORPAY	pay_Qd29g3DY4lF6Fq	COMPLETED	Initial subscription payment for Elite plan	\N	2025-06-04 07:18:39.112795	2025-06-04 07:18:39.112795	\N	\N	{"isUpgrade": false, "userRegion": "GLOBAL", "planDetails": {"id": 6, "name": "Elite", "cycle": "MONTHLY"}, "userCountry": "US", "paymentDetails": {"actualCurrency": "USD", "correctPlanPrice": "29.99", "expectedCurrency": "USD", "correctPlanCurrency": "USD", "hasCurrencyMismatch": false}}
\.


--
-- Data for Name: payment_webhook_events; Type: TABLE DATA; Schema: public; Owner: raja
--

COPY public.payment_webhook_events (id, gateway, event_type, event_id, raw_data, processed, processing_errors, created_at) FROM stdin;
\.


--
-- Data for Name: plan_features; Type: TABLE DATA; Schema: public; Owner: raja
--

COPY public.plan_features (id, plan_id, feature_id, limit_type, limit_value, reset_frequency, created_at, updated_at, is_enabled) FROM stdin;
8	4	1	COUNT	25	MONTHLY	2025-04-23 17:40:53.61855	2025-04-23 17:40:53.61855	t
9	4	2	COUNT	25	MONTHLY	2025-04-23 17:41:04.027581	2025-04-23 17:41:04.027581	t
12	6	6	COUNT	500000	MONTHLY	2025-04-23 17:49:07.814605	2025-04-23 17:49:07.814605	t
14	6	7	BOOLEAN	\N	NEVER	2025-04-23 17:50:40.884861	2025-04-23 17:50:40.884861	t
17	6	1	UNLIMITED	\N	NEVER	2025-04-23 17:51:54.881423	2025-04-23 17:51:54.881423	t
18	6	2	UNLIMITED	\N	NEVER	2025-04-23 17:52:00.189767	2025-04-23 17:52:00.189767	t
13	5	3	BOOLEAN	\N	NEVER	2025-04-23 17:49:21.932951	2025-04-23 17:49:21.932951	t
15	5	1	COUNT	100	MONTHLY	2025-04-23 17:51:29.07204	2025-04-23 17:51:29.07204	t
11	5	6	COUNT	200000	MONTHLY	2025-04-23 17:48:08.615443	2025-04-23 17:48:08.615443	t
16	5	2	COUNT	100	MONTHLY	2025-04-23 17:51:44.888703	2025-04-23 17:51:44.888703	t
10	4	3	BOOLEAN	\N	NEVER	2025-04-23 17:41:13.416561	2025-04-23 17:41:13.416561	f
21	6	12	UNLIMITED	\N	NEVER	2025-04-23 23:28:20.262675	2025-04-23 23:28:20.262675	t
19	4	12	COUNT	25	MONTHLY	2025-04-23 23:27:45.052782	2025-04-23 23:27:45.052782	t
22	4	6	COUNT	100000	MONTHLY	2025-04-24 02:28:43.010045	2025-04-24 02:28:43.010045	t
23	5	13	BOOLEAN	\N	NEVER	2025-05-01 14:27:07.488664	2025-05-01 14:27:07.488664	t
24	6	13	BOOLEAN	\N	NEVER	2025-05-01 14:27:23.257329	2025-05-01 14:27:23.257329	t
25	4	13	BOOLEAN	\N	NEVER	2025-05-01 14:27:34.339801	2025-05-01 14:27:34.339801	t
26	4	14	BOOLEAN	\N	NEVER	2025-05-01 14:28:48.632726	2025-05-01 14:28:48.632726	t
27	6	14	BOOLEAN	\N	NEVER	2025-05-01 14:28:56.672503	2025-05-01 14:28:56.672503	t
29	5	14	BOOLEAN	\N	NEVER	2025-05-01 14:29:38.561408	2025-05-01 14:29:38.561408	t
20	5	12	COUNT	100	MONTHLY	2025-04-23 23:28:11.739623	2025-04-23 23:28:11.739623	t
30	5	15	BOOLEAN	\N	NEVER	2025-05-01 14:35:48.043017	2025-05-01 14:35:48.043017	t
31	6	15	BOOLEAN	\N	NEVER	2025-05-01 14:35:55.858623	2025-05-01 14:35:55.858623	t
33	4	15	BOOLEAN	\N	NEVER	2025-05-01 14:36:20.734306	2025-05-01 14:36:20.734306	t
34	4	16	BOOLEAN	\N	NEVER	2025-05-01 14:38:02.587095	2025-05-01 14:38:02.587095	t
36	6	16	BOOLEAN	\N	NEVER	2025-05-01 14:38:17.160043	2025-05-01 14:38:17.160043	t
37	5	16	BOOLEAN	\N	NEVER	2025-05-01 14:38:28.572312	2025-05-01 14:38:28.572312	t
38	8	1	COUNT	5	NEVER	2025-05-16 02:35:03.607337	2025-05-16 02:35:03.607337	t
39	8	2	COUNT	5	NEVER	2025-05-16 02:35:18.983965	2025-05-16 02:35:18.983965	t
40	8	3	BOOLEAN	\N	NEVER	2025-05-16 02:35:39.002584	2025-05-16 02:35:39.002584	f
42	8	13	BOOLEAN	\N	NEVER	2025-05-16 02:36:38.227616	2025-05-16 02:36:38.227616	t
43	8	15	BOOLEAN	\N	NEVER	2025-05-16 02:36:58.688483	2025-05-16 02:36:58.688483	t
44	8	12	COUNT	5	NEVER	2025-05-16 02:37:12.06361	2025-05-16 02:37:12.06361	t
41	8	6	COUNT	10000	NEVER	2025-05-16 02:36:18.390567	2025-05-16 02:36:18.390567	t
45	8	17	UNLIMITED	\N	\N	2025-05-30 22:01:45.119115	2025-05-30 22:01:45.119115	t
46	8	18	UNLIMITED	\N	\N	2025-05-30 22:01:45.119115	2025-05-30 22:01:45.119115	t
47	4	17	UNLIMITED	\N	\N	2025-05-30 22:01:45.119115	2025-05-30 22:01:45.119115	t
48	4	18	UNLIMITED	\N	\N	2025-05-30 22:01:45.119115	2025-05-30 22:01:45.119115	t
49	6	17	UNLIMITED	\N	\N	2025-05-30 22:01:45.119115	2025-05-30 22:01:45.119115	t
50	6	18	UNLIMITED	\N	\N	2025-05-30 22:01:45.119115	2025-05-30 22:01:45.119115	t
51	5	17	UNLIMITED	\N	\N	2025-05-30 22:01:45.119115	2025-05-30 22:01:45.119115	t
52	5	18	UNLIMITED	\N	\N	2025-05-30 22:01:45.119115	2025-05-30 22:01:45.119115	t
\.


--
-- Data for Name: plan_pricing; Type: TABLE DATA; Schema: public; Owner: raja
--

COPY public.plan_pricing (id, plan_id, target_region, currency, price, created_at, updated_at) FROM stdin;
14	8	GLOBAL	USD	0.00	2025-05-16 02:34:22.92302	2025-05-16 02:34:22.92302
15	8	INDIA	INR	0.00	2025-05-16 02:34:22.925549	2025-05-16 02:34:22.925549
6	4	GLOBAL	USD	9.99	2025-04-23 16:14:52.462451	2025-05-20 00:48:22.576
7	4	INDIA	INR	899.00	2025-04-23 16:14:52.46318	2025-05-20 00:48:22.577
8	5	GLOBAL	USD	19.99	2025-04-23 17:45:53.291003	2025-05-20 00:48:49.713
9	5	INDIA	INR	1799.00	2025-04-23 17:45:53.293769	2025-05-20 00:48:49.713
10	6	GLOBAL	USD	29.99	2025-04-23 17:47:02.677855	2025-05-20 00:49:12.08
11	6	INDIA	INR	2499.00	2025-04-23 17:47:02.679169	2025-05-20 00:49:12.082
\.


--
-- Data for Name: resume_templates; Type: TABLE DATA; Schema: public; Owner: raja
--

COPY public.resume_templates (id, name, description, content, thumbnail, is_default, is_active, created_at, updated_at) FROM stdin;
1	Professional			/images/templates/template-1-1748646198511.jpg	f	t	2025-04-12 19:29:03.901764	2025-04-12 19:29:03.901764
6	Modern Sidebar	A clean, modern two-column layout with a sidebar for contact info and skills, perfect for showcasing technical expertise.		/images/templates/template-6-1748646580966.jpg	f	t	2025-05-30 03:46:20.287767	2025-05-30 03:46:20.287767
3	Minimalist ats			/images/templates/template-3-1748646914135.jpg	f	t	2025-04-12 19:29:03.905554	2025-04-12 19:29:03.905554
2	Elegant divider			/images/templates/template-2-1748647812000.jpg	f	t	2025-04-12 19:29:03.904051	2025-04-12 19:29:03.904051
\.


--
-- Data for Name: resumes; Type: TABLE DATA; Schema: public; Owner: raja
--

COPY public.resumes (id, user_id, title, target_job_title, company_name, job_description, template, full_name, email, phone, location, country, city, state, linkedin_url, portfolio_url, summary, work_experience, education, skills, technical_skills, soft_skills, use_skill_categories, certifications, projects, keywords_optimization, is_complete, current_step, created_at, updated_at, publications, skill_categories) FROM stdin;
15	1	Testing resume upload	testing	\N	testing	professional											[]	[]	{}	{}	{}	f	[]	[]		f		2025-05-31 17:11:32.521147	2025-05-31 21:11:34.017	[]	{}
7	13	KP 	Associate Professor	Kaiser Permanente	Job Summary\n\nThe Department of Health Systems Science (HSS) at the Kaiser Permanente Bernard J. Tyson School of Medicine (KPSOM) seeks to expand our research capacity, particularly in three priority areas of inquiry: learning health systems (including embedded research and implementation and improvement science), health information technology (including clinical informatics and healthcare applications of artificial intelligence), and health equity (including health disparities and social and structural drivers of health). Applications will be considered for faculty positions at the Instructor, Assistant Professor, Associate Professor, and Professor levels. We aim to recruit faculty members who share our enthusiasm for building a research enterprise that emphasizes innovation and excellence within a new and growing school of medicine that highly values inclusion and diversity. Our conceptualization of the health system extends into the community and embraces engaged and partnered approaches.\n\nThe HSS mission includes: 1) the pursuit of a broad scholarship agenda that will improve health, health care, and health equity through systems transformation and redesign; and 2) delivery of an innovative foundational curriculum in four domains: community and population health, health care and social systems, quality and safety, and research methods to inform evidence-based clinical practice. While this recruitment prioritizes hiring faculty members to support the Departments scholarship mission, faculty will also be expected to contribute significantly to student teaching and research mentorship.\n\nEssential Responsibilities\n\nDevelop and/or expand a program of externally funded research in one or more of the core domains of learning health systems, health information technology, or health equity. \nSupport and serve as a mentor to KPSOM students as they pursue both required and ancillary scholarly projects. \nEstablish productive collaborations with current HSS faculty members in one or more of the above areas of thematic interest. \nIdentify opportunities to partner with health system leaders to address health system priorities using diverse research methods and approaches. \nEngage in scholarly activities in clinical and community settings, including health services and health-related social sciences research; improvement and implementation research; and health-related program and policy development and evaluation. \nServe as presenters and facilitators in large, medium, and small group learning sessions. \nContribute to ongoing development, revision, and refinement of the HSS curriculum. \nScholarly and pedagogical duties, expectations, and resources will be individually developed based on evolving faculty interests, skills, departmental priorities, and needs. \n\nExperience\n\nBasic Qualifications:\n\nN/A\n\nEducation\n\nMD, PhD, other doctoral degree, or comparable degree. \n\nLicense, Certification, Registration\n\nN/A\n\nAdditional Requirements\n\nDemonstrated ability or potential to obtain funding from diverse sources, including National Institutes of Health (NIH), Patient Centered Outcomes Research Institute (PCORI), private foundations, and industry, preferred. \nConfirmed track record of first or senior author publication in journals of clinical medicine, population health, and health care research, preferred. \nDemonstrated outstanding teaching abilities and commitment to teaching, preferred. \nProven service in disadvantaged communities, preferred. \nDemonstrated health-related scholarly experience in one of the following or related fields of study: artificial intelligence/machine learning, clinical informatics, delivery system science, economics, embedded research, health equity, health policy, health services, implementation science, improvement science, management science, outcomes and comparative effectiveness research, public health, sociology, statistics, or systems engineering. \nProven strong collaboration and communication skills. \nDemonstrated strong critical thinking, leadership, and organizational skills. \nEstablished a strong commitment to equity, inclusion, and diversity. \n\nPreferred Qualifications\n\nN/A	elegant-divider	Guy Hembroff	hembroff.research@gmail.com	906 370-9913	\N	\N	ATLANTIC MINE	MI	https://www.linkedin.com/in/guy-hembroff/	https://sites.google.com/mtu.edu/bdslab	Associate Professor with expertise in learning health systems and healthcare applications of AI. Proven track record in embedded research and implementation science. Committed to diversity and inclusion, fostering student mentorship, and establishing impactful collaborations.	[{"id": "1747178108624", "company": "Michigan Technological University", "current": true, "endDate": null, "location": "Houghton, MI ", "position": "Associate Professor", "startDate": "2010-08-23", "description": "College: College of Computing | Department: Applied Computing\\n\\n\\n\\nDepartment Affiliations: MS, Data Science | PhD, Computational Science & Engineering\\n", "achievements": ["• Led the development of an evidence-based clinical practice curriculum by integrating health information technology and clinical informatics, enhancing.", "• Championed diversity and inclusion initiatives within the department, increasing underrepresented student enrollment by 15% and fostering an inclusive.", "• Advanced research capacity in learning health systems through embedded research, securing $500,000 in external funding for innovative projects.", "• Mentored and supported graduate students in developing research skills, resulting in a 40% increase in successful student-led publications.", "• Established productive collaborations with interdisciplinary faculty, contributing to a 20% growth in cross-departmental research projects."]}]	[]	{"Embedded Research","Implementation and Improvement Science","Evidence-based Clinical Practice","Values Inclusion and Diversity","Curriculum Development","Research Methodology","Quantitative Analysis","Qualitative Analysis","Data Analysis Software","Learning Management Systems","Grant Writing","Academic Publishing","Classroom Technology Integration","Pedagogical Strategies","Subject Matter Expertise","Accreditation Standards","Effective Communication","Critical Thinking",Mentoring,Collaboration,Adaptability,"Problem Solving","Time Management",Leadership,"Ethical Judgment","Cultural Competence","Student Engagement","Conflict Resolution"}	{"learning health systems","embedded research","implementation and improvement science","clinical informatics","systems transformation and redesign","evidence-based clinical practice","Curriculum Development","Educational Technology","Research Methodologies","Data Analysis","Grant Writing","Peer-Reviewed Publications","Quantitative and Qualitative Research","Learning Management Systems (LMS)","Microsoft Office Suite","Instructional Design","Online Course Development","Embedded Research","Implementation and Improvement Science","Evidence-based Clinical Practice","Research Methodology","Quantitative Analysis","Qualitative Analysis","Data Analysis Software","Learning Management Systems","Academic Publishing","Classroom Technology Integration","Pedagogical Strategies","Subject Matter Expertise","Accreditation Standards"}	{enthusiasm,inclusion,diversity,"Effective Communication",Leadership,Mentoring,Collaboration,"Critical Thinking","Problem Solving","Time Management",Adaptability,"Public Speaking","Conflict Resolution","Innovative Thinking","Cultural Competence","Values Inclusion and Diversity","Ethical Judgment","Student Engagement"}	t	[]	[]	\N	f	details	2025-05-13 19:09:34.606871	2025-05-16 03:15:54.593	\N	{"Soft Skills": ["enthusiasm", "inclusion", "diversity", "Effective Communication", "Leadership", "Mentoring", "Collaboration", "Critical Thinking", "Problem Solving", "Time Management", "Adaptability", "Public Speaking", "Conflict Resolution", "Innovative Thinking", "Cultural Competence", "Values Inclusion and Diversity", "Ethical Judgment", "Student Engagement"], "Technical Skills": ["learning health systems", "embedded research", "implementation and improvement science", "clinical informatics", "systems transformation and redesign", "evidence-based clinical practice", "Curriculum Development", "Educational Technology", "Research Methodologies", "Data Analysis", "Grant Writing", "Peer-Reviewed Publications", "Quantitative and Qualitative Research", "Learning Management Systems (LMS)", "Microsoft Office Suite", "Instructional Design", "Online Course Development", "Embedded Research", "Implementation and Improvement Science", "Evidence-based Clinical Practice", "Research Methodology", "Quantitative Analysis", "Qualitative Analysis", "Data Analysis Software", "Learning Management Systems", "Academic Publishing", "Classroom Technology Integration", "Pedagogical Strategies", "Subject Matter Expertise", "Accreditation Standards"]}
8	24	network	System Administrator II	michigan Technological university	Summary\n\nThe Information Technology department of Michigan Technological University seeks a System Administrator II in our Core Services group works in a team of professional IT staff that is responsible for the effective provisioning, installation/configuration, operation and maintenance, security, and performance of a large number of Linux servers and systems related to campus authentication, email, Google Workspace, directory services, DNS, DHCP, application load balancing and web sites/applications.\n\nResponsibilities and Essential Duties\n\n● System Administration of core services to campus such as Google Workspace, authentication(CAS/SSO/LDAP), web hosting(cPanel/Apache), load balancing and the campus VPN services.\n● Provide advanced technical skills to install, configure, secure and maintain a wide variety of Linux servers, applications and services.\n● Plan ahead for necessary hardware or software improvements to support system growth.\n● Work closely with others in IT to ensure effective data security, business continuity, and performance.\n● Monitor event logs for changes or errors and take appropriate actions to resolve issues.\n● Prepare oral and written status reports on assigned projects.\n● Identify tasks which require automation and implement the required automation.\n● Maintain up-to-date knowledge of advances in information technology systems.\n● Organize and participate in providing on-call and emergency support for critical campus systems under your group's control.\n● Collaborate with other Linux/Unix system administrators allowing for a consistent and cohesive environment.\n● Commit to learning about continuous improvement strategies and applying them to everyday work. Actively engage in University continuous improvement initiatives.\n● Apply safety-related knowledge, skills, and practices to everyday work.\n\n \n\nRequired Education, Certifications, Licensures\n\nBachelor’s degree in system administration or comparable technology related degree program; or an equivalent combination of education and experience from which required knowledge and abilities can be acquired.\n\nRequired Experience\n\nAt least 2 years experience in Linux and Unix OS administration, maintenance and support including installing, maintaining, troubleshooting, and using Linux/Unix standard systems and software applications.\n\nDesirable Education and/or Experience\n\nWorking knowledge of Oracle, MySQL, or MS SQL Database Systems.\nFamiliarity with cloud services: Google Apps, AWS, Office365, Cloudflare.\nKnowledge of common network concepts, protocols and tools.\nExperience working with configuration management systems such as Puppet, Chef, Ansible, etc.\nExperience with source code control and versioning systems such as Subversion, or git.\nExperience and ability to work within formal change management systems.\nRequired Knowledge, Skills, and/or Abilities\n\nProficiency installing, configuring and managing Apache and/or Nginx in a production Linux/Unix environment.\nProficiency installing, configuring and managing Postfix, Sendmail, DNS, DHCP, and/or other similar common Linux server applications.\nProficiency with Bash, Python, Perl, or similar scripting language. \nDemonstrated success in working with persons  with a wide variety of personal characteristics and viewpoints.\nDemonstrated understanding of network design and concepts including firewalls, VLANS, subnetting, and routing.\nExcellent communication and interpersonal skills, including the ability to build solid working relationships with people of diverse personalities and professional backgrounds, with a strong focus on customer service.\nAbility to carry cell phone, work outside regular business hours and be available on-site during an emergency.\nDemonstrated commitment to contribute to a safe work environment.\nDesirable Knowledge, Skills, and/or Abilities\n\nKnowledge of authentication, authorization and identity tools such as LDAP, Active Directory, CAS, and/or SAML.\nKnowledge of application traffic management/load balancing.\nExperience using customer issue tracking software.\nThe desire and ability to keep abreast of new technologies including desktop, laptop, and server hardware; Linux and Unix operating system and application software; and high performance computing related technologies.\nHighly organized and able to adapt quickly to changing priorities.\nSkill and ability to handle stressful situations and multiple deadlines in a calm, professional manner.\nWork Environment and/or Physical Demands\n\nWORK ENVIRONMENT: The work environment characteristics described here are representative of those an employee encounters while performing the essential functions of this job. Reasonable accommodations may be made to enable individuals with disabilities to perform the essential functions.\n\n\nThe noise level in the work environment is usually low to moderate.\n\nRequired Training and Other Conditions of Employment\n\nEvery employee at Michigan Technological University will receive the following 4 required trainings; additional training may be required by the department.\nRequired University Training:\n● Employee Safety Overview\n● Anti-Harassment, Discrimination, Retaliation Training\n● Annual Data Security Training\n● Annual Title IX Training\n\nBackground Check:\nOffers of employment are contingent upon and not considered finalized until the required background check has been performed and the results received and assessed.\n\nFull-Time Equivalent (FTE) % (1=100%)\n1.00\n\nFLSA Status\n\nExempt\n\nPay Rate/Salary\n\nThe anticipated salary for this position is between $60,000 - $90,000; however, the final salary will depend on experience and qualifications.\n\nTitle of Position Supervisor\n\nDirector, IT Operations\n\nPosting Type\n\nInternal and External Posting\nDependent on Funding\n\nNo	minimalist-ats	5470bea1711b13c3:87afb84922613b3cc92266c534a72d27:76dbab8e143a585da8cac65fcef5	8a3bab340d1d0fce:7a1edbde881269e4fede436d7f549bac:377b4f2b48b020661bbee7cfb800d46828ee49c0ddce090239bcaf4679	513de900aac940a0:4053050e07eb0e4ddc0fa21fc104f713:1eedcc7eb91833de3b24cca140da	\N	\N	Riverside	California	https://www.linkedin.com/in/ritheshreddy16	\N	57838075b98146e6:117ea38a1d545fd99f9747b7f57cd59b:9fa7ff6f95086c6a72b3a828cac2afc0b2c91ea39324cf573f10a63609157ce4588d2e400a1f233e97295579c52119c986f9ce340bfdc873fb1a84bc2ae65995e29c22516c774f34517d4b0201361bcbd9a5a1bc96d8ba55502bf078df3d31a7af8a274e7675a9af4617061256cd4b3f235a4a58e609ce2c3d455911f1d1dce6c57643e4ad0b586b1c365738f96ccdf207ce1631eb454e87334c9cbd7630616ea03985a3d084d93a8e2ea840c1cf5ba33cc2b449698da9239481d8f3f137f5c1272af3ab8c1efa57d7643345c0f07716e0f54b65d42e11af4d8e3fdee061acf5103ca25e436c7d8dc6d795988f643590648930726879d6e4efc0967da58f9aa610ef3669167471568873e3896cc327a343ffb5f96747e2852f77b1a85a2669efe3ac1e4d15e79b797a8f5fb1	"702548b71c64a0f8:6e109aae2eaec412f4e048ced91bd3c6:98b1037ec8329d7e544051924e9096243ccde23b1ba0c17abb39128f0a00a692d8bcea96a8a9742705cb4f9596b411402070d703239d59680a7e34d16924298eb78deb5ff9c2903a1a0d40fdf8e3f03c556c19048a439f4c70983a2d016a042893c4fa83ffac4f4576a53715188ee622b703329829fc98a07fceb03a5fcb9f6ef2cadcd3e751494f402a088981aae9fe1350e0c0a41777ee7f0fa73e1a076be3e99d4b40eb5bfba40d30d33751d54946c44d8a3e36fcb871ec105a92a4516f933654362adfb8c41a670d0148da4aca27d23bb45397159dcf7213b54a6c2122a8b6a7b16145338a815e4792ea7b08069ffad2c5d84d0bebcc954e79e8ca7e4e803f31184bee8a5bfa4321fe27cce23fe137aabd8a5a64fa9a7d4581baf7cb4380fbfc8f30dbc4f1a4b530be722cf7096b0f45f251dd3537517ea91c1e8d926b9cec1b42784d2567ab9b44df410f6796d1060bda4c345012534836881937b20e1cbb697a5c3f6267cf7dd5d7474e585ebfcedcc423b81c988068a8e259d3f480810ad5574feb7c36cd2a1f6ed5053fdf97361028ba716c47aeee4d323b979a5d9ce07f42d0a18d9846d3fb6298cbd74591ddf6e10b7251fa65990695301ba2432cf940c8e52f64d926288b362374331aed0db9703a1c8cf2a03c407b6fc5018ac38b7997c473b8f0c76ff4de950882fa3ad2eb6fb495023f6e179b1bbcc4fdaf3567875cd8abbc5ed80a06582a95e0b761284a0b8cd0f2d6720cefe273590d66e92c04d6fc37d42bed5585994d269a18f7367eaf3abb6e88975d0e4349bc82c8f883a88eabd34162b999eac47f8e68342facc86ea9ab44e4b54c69334c8af64b46c7ac347944f6a50377d2c30d9cba91cd9ba0fac15aaa4ee418d57ca22935e2f6897befdd26be30387cba6ab66ee40057cd5a81fc981ccf47a1b2022eb0b2621b3d36f1e8a0dbc2c30506fd8620e586db60891dd454f8fef03df8f883d988e7b4d02b46822f56e1d89993d787a3315ffeddf202f1cbd6de3c205f85ff7b8e31e22463319c05e1ffd69d7f2d58b95f86d605b799cce3c9948caffe4e8c687c1300405a64a902faec6089f60a0266bcd9c2af23bce68b67b558ee135f8f122a85f2d4bf16711575"	[{"id": "1747524471467", "degree": "masters", "current": false, "endDate": "2025-05-03", "startDate": "2024-03-01", "description": "", "institution": "university of cumberlands", "fieldOfStudy": "Information Technology"}]	{"Linux/unix Administration","Windows Server Management","Active Directory","Vmware Vsphere","Network Configuration and Troubleshooting","Powershell Scripting","Itil Foundation Certification","Backup and Recovery Solutions","Firewall and Security Management","Tcp/ip Networking","Problem Solving","Attention to Detail","Communication Skills","Time Management","Team Collaboration",Adaptability,"Customer Service Orientation","Analytical Thinking","Proactive Approach","Stress Management"}	{"Linux/unix Administration","Windows Server Management","Active Directory","Vmware Vsphere","Network Configuration and Troubleshooting","Powershell Scripting","Itil Foundation Certification","Backup and Recovery Solutions","Firewall and Security Management","Tcp/ip Networking"}	{"Problem Solving","Attention to Detail","Communication Skills","Time Management","Team Collaboration",Adaptability,"Customer Service Orientation","Analytical Thinking","Proactive Approach","Stress Management"}	t	[]	[]	\N	f	details	2025-05-17 19:19:11.196322	2025-05-17 23:34:37.444	\N	{"Soft Skills": ["Problem Solving", "Attention to Detail", "Communication Skills", "Time Management", "Team Collaboration", "Adaptability", "Customer Service Orientation", "Analytical Thinking", "Proactive Approach", "Stress Management"], "Technical Skills": ["Linux/unix Administration", "Windows Server Management", "Active Directory", "Vmware Vsphere", "Network Configuration and Troubleshooting", "Powershell Scripting", "Itil Foundation Certification", "Backup and Recovery Solutions", "Firewall and Security Management", "Tcp/ip Networking"]}
13	32	Sanskruti Mars.INC 	Sale Account Specialist 	Mars. INC 	Create and implement territory coverage plans for optimal account coverage\n\nConduct 85% in-person sales calls\n\nUse Salesforce to manage partners and customer data\n\nForecast and build territory sales plan/ Deliver on annual sales\n\nUnderstanding territory sales data and developing a unique strategy for growth\n\nAttend appropriate/relevant events annually within your territory\n\nEducate partners on Royal Canin and Eukanuba nutritional diets and programs\n\nRecommend Royal Canin and Eukanuba nutritional and SOL solutions\n\nPresent customer programming and building estimated feeding guidelines / budget\n\nDrive recommendation from partners\n\nRecruit and source new partner acquisition across working professionals\n\nCollaborate with PSRO and Vet Colleagues to drive PRO business and Recommendations\n\nAchieve profitable sales growth objectives within assigned territory by utilizing strong selling skills while developing and understanding customer needs to increase growth of sales.\n\nDevelop and maintain strong customer relationships with key individuals within PRO customers and continue to identify new potential customers and set strategies to align customers for recommending Mars products as their primary diet for their clients.\n\nCollaborate with your team and other company associates to provide valuable contributions to the company and provide customer insights to your regional team.\n\nAttend and participate in events, regional and company meetings/conference calls as required.\n\nComplete weekly activity, expense, and other ad-hoc reporting as needed by your manager.	professional	8afbf42e5234b487:b93aa3b80f8085c424f99199769d3072:0183c7bd6737dd4f8b9c9a195d8ebc080ae4	d9e81b2382cd6dea:2da52bdf57f64af17e9c17deb0a6511e:6aa887dbc9fa9589cbc7d0a8885e7758327d3ab343	7ff8dbd58a1ae680:40844f14d75f0d47434e349738cf18a5:d255d9390a6eec3df62c893f	Los Angeles, California	United States	Los Angeles	\N	www.linkedin.com/in/sanskruti-kavatkar			"a0071bcc28636773:477e919a9ae54da61eea90eb6b61d597:c98195b23c13dd87f78c5465ac4e7bc6c4934672b21a01034e569fa84f0e8036550461a0d3057be044a8317690dc17b991d5931c67591663b5a79af20b8f266f1d9ea284e32e2237bc97328dd56d5e6cec75190af05dcb8cd9c9e4fce3abb78742e31a5502bee98f412268e71608318daf72fafccba6a4a3afb467cfa5948a539aa84e010093902412e78ed3bbabfb0757d7d289597a393d5be950b3cfaeadfb2d9433b884a193f6392fb845a598ac079c3080be01dd4fde2553c71b8199311fee4de07bcdf363e51944648f607d2c8c2e52be9a13c20e0427805a59cca211e3091d14ecde116cf0943b0d328043ccc0925487284f56152b558072814bbcb4f9917acee55d1c05d99a0c71fea8a150956e60a6451f2429ea8e28e3a8a83da552e39028a47b5ffb4203cdf5523bb5a1b844be23c91485dc3462970c6d430b9a0a670d6e88c265ce091b41f51082f6f92322f30a01018494c973b3bfadfa557da9f0d7fe2a2f2433c55c698973cdb9cf11e970ce0c682667d6300ae563f7b19adfb67e35ef526f3fa4c478d9037c6f80b141207ce31d7eec58176d1808f2e387af732f3fe6978672d3418ceea57fa450170fc86a060c571c4f30b3dae5435a7976de4691a73725128810136f6e4c675f92688940ea28489fbca9e30483c3a9098436c0b340155fd4d0b3f1520fdc33d9e193bd432b19f6b4a8933c37dc6e3c779de737e7440945506d7c6e2c0ef6f4d484d149237fe884d05eea8366251d93364df84c50618c5a08034edc8968cff500938cc4e27acf32d8e192f37e0f5b043f227a57a79b3c851bae7c841cdd62c381e4e16bbe8db1356c4360fdcb76702ffa4535706bf69a3c3c4bdd79dac52eebd890a99f875aaf5da78aa41c4c5653c8c9835bef6be9cdca8211b4fbf962dfd363bb25e3ea4385fa9ff6476384b9f82a11b2a22dd37c3023fb38d537691cfd3fd53b6d9ac5c1d16570c524abfd256c7ba6fd04c15fdfd7a3d34ec9d9c319bb49840ba0765152f436967b50da36f29086186e6e18ea8e31bb5c6160d7bdf5673aac55f592588c28fe527b316585fd09dbce2dc5e2b00c6f5397ae236c266eb96513957c30b5171838a36b2f6d012d10366ddd0d16396ab0a1a25bf8af0c431bde24ce3acdd67fffde614565f917cd470d564bef22531919f36fe51b01142ab4f64ba117b172074c1db6c4700037cad62081b584c1eeb968e1ab275012cdab60ece4dfc9aef2bf9b7779d82ca5b64904738584a276ee5e3c4dd9efd7930b2318e69aeff78c6bd5f7d94ea4d95e6ae4da88d9ce968739bf11ce87bee1a481f671538d1d7ab1d3ca431df6ebe0939dee73b76b01802fb9b9167ac14e01154f1ddb98121188dc273cb2b2e8bdf2e48deebab0aabc088610907b5ad2721136b5614f2492f86c999563b3698ffcfd3f4a2a9cc724608f0d31ab50bba48b856624b1cf3af51472b5a9cfdf1878bcbf5e2316c4c72042c93b49510307ee8abd46bef5f620b26bd3e496820c068d35f1e2bffc1c2154b2542441cb1a4c5ce87042af1dd4301f61efa7f107f4fcecbf51c55feac4758ce5f73fb6c5465b6fe256381feef74460446fec5cd7916d81c298183123896a48110f005fddfea0ac87eed9c40ed6445431d196d2b5eb54b06ec668ae8260d595d2ece1c55f17b38ec1dd5931100aa4da67c01995f1647cf45cda1a7e59d4f2768daf143f34a9076f921c30f314157ee6655109e4656309fc4b590c7fdc41a7afb24ba1656fed6e8bf083411665b9f2a550087ef9d7bf68191222a80555c25503e64e95a40eea45b91dcb7caeca256a5ab76d29faa584ce1bc18a47e8e624e4fbdb463fbcc5895c474a619756f1a4c6d567597d7f137e6af97879d9be354e35a5a0bc0cc8d10b538e6b50d79ed601faeaa1f132272dd2713ee1349e3cb0b142ebf7f83a1eeae72b6d612c5ddb7bfe9cba4843aa1cc43805eae5d4818d8bc668c50d1c879956f84db0d537b6ea72a0b04239e249bf80cd3119038958ad15b4e586da6a408b9116596589c14466cd0f814195448c1d08b849408d591753e4a6e8bd0f15b91bd6ce17b4434ad8d3da8ad5952daa7a321daec5c5263138b961ae43741566bdc34c501aaa9376b8b32ac33d7c9093a01582aeae199a122db9c8b3a6b60787968077734f886d006050bea5e08c42ae2a7a69068c5a9dbedc5152f6c7739a49493346e938ca2caddaef1e25df3a3d27cd09ce4427f954a6e91f2315a452380f49cee398bfc4e28a06dfd6d4349a4e6b63f7cd076ad84e1cd9b304d5736c01bc6d36f5dfd51f29fe48dbb6562165a6577541afd2bd4156bf55a90ee3dffe1943d3d56d4e747e890e0c50aec3cea2c873e024878460da8795f1268a7e0fca2c956b9ca11583d48ead484482b9914832fbdb7f6e46ebafaa504a2e8dfb48316dd8a1424813568165454a3e6bcd51380fa6dbafd4a4c9b756cdea352859dd7b8afe6d5e44eacab9b3ce9d1537a95ef1fd65f1737123e7f43740519846430dae4c5f10ad06ba368efa1510fa3cb3dbf33ba75210395c9ecaf71a7235cc151dad6d3719c739416911a4b5c0413f8ac2cdf32fb874096d9685f8ae36e03ee36b72c2cf1671e2db9cc6ca54424fa910ed915908bd7084b5a6ac68e4642a9b9f7442a664bd9bf25eb48682750bb32c2865aedefec1f4338f96672d08023637ec3e51b75d20ae43c97a10b474fa367e4f68b1d31eb7e04921e8bcd7d759cd9daa72c81e19b706a3e2bc152dd5dc87bc084fc6d13ddeaa3da1789b33562f53a315580b37fe1466a81a6688433b9f13e247b79bb4e0d42901432d9341330e7ab6166463a4aa722715e979b6fb4759b0dac34e1c60558a715ae09f6c6e276bf3c61b9b3838a5e35a57574b889f6ad657f0d9d4b56860213f6797cf9f6a70115592a5f288c5a597230b8fb825116b37de83d388d8e1e4f843840aebcb61284e37bfe82d2bdfdedb8956f2c9b8ad69ba81773530a742494690311b4edc129252432de717bcc6218cc4532fb36df6c6f9430d02effb69ec9e18124d3c120cb134407d5484bc97f04fc7f3627a7afa40cc8c1784963e9903214cdcb836a8926f4816cd04e835d658850e1a3731fb2f8845e9dfef49b2648bc6a620b7bd918d963acc805e28607198e84f64744a778633cc90b9220f1e782e88a05df9b4dee06c8c32cd608a9302c5d101e88287e1444c4db857199463e2064b350ef8c41a8d5c7ad2682f9a0dffa499bff5f5ba840d01ed4cad6aef0669414931fd989ed7971e0d0e0fbed4796910f70096a5df145a2f12d7d79dd5fb4a4ca9032207cdecbc060ee87f553d33de6846bfb05ba26fc2488ab8ad98840813786d18d267f64492b4b2cd9e4cd52e6127513d7c79ae0ec4e515f22c7fc2598b392ae808247067554fe4cecf91769a0c48602172670d78e4528752140555230eba445af62964d029e4f1503c97a2ff0d1bf72847ba7caaf2f33fabf0e14003f1faa539b9eb905433c9c52443684ecf995017eca2a219379a753974d4367747b94d781160438d5d1cf3acb2c9a992981745d4f2f33d5d86ce5cb7d55239786a85aed352af8bbf30c29d7322d48ffd3e7a7c3ccd425cb8ccf731ddecf4b5e9a546f6f731cfa3c8b160395ccbab58a900429baafb7058704ecf1318eef071f409213156fe4babc7c8dce0446cbf3b1126cb1ae54e7b78620f2e18b09df339baffa890146c67db8a180b8f41d72cc816e8bbe1d615bbfa5ec4a1f8901e6002352421536a9ef055f4a50f7f280826c154b87d7029dd19423215df83a01156bbb0048c6df385a3c8cbde021f16e98d0daf4e8e5b3a548e345a0bc6e8b5c0a8066dd392ceff95019fba97fd6ea2f90bce6befee45470a5be167139fe4e99417d109f49c760fa9d4595c0bbcfa3146dd636922a220b5529662fa021b36d6436e976d366a112268d7db15eb5d4edf18b2e7da782adabc7a4f6046fc39a11a3c992ce6fa28dc3544de83bc8eebb1af5d6bf85e0946f4fb25a0ca3be46839374febdaafaa70b9f43eff15a3c91de6073b4df90ec3b5285e6cc6fa9d2a1678909a973fc59e79bf9f0c48dc4190a843eba6b413eedbde01958fdfad7fa9b658277dce88d966d7b332a45fcb351cc83b944dcf2d4c0cfe8fb7dde85a8105b892268750e6717c5cdcf0c3da1abe9af688239d7084755bd2e10d3cd42fae44dba6d3ca3ee610c53b1d719f50a5470424c9fcbc202209a230347faeb29a935a5c2f94d312a63d2afcbe8dc89baf1552bf3c3e233f24546ce604d5414e6ab2f2e238ce61670c6a2da60476c0584f30b9240a3e46f58be7d9a9c99f7b48ee4c07707ae5bc3827238e288e10eabc319486fbc05727a6097da50e97b406296ca9df8e72f9685eee447854ecb9c1dc904672585e7307e5d3d034944da8817972e896969a448e01568cab087591efaa3a4163fe7771fc4d8699c6b9a271d1f748abac72090a57cd967a5af699679874d32d3212d970d2dd9de151010bb8edf6c46c978e55a4cf9b004cc398fd2fb0d9ca14f9f9a942190a81e13f4001f0f921d5976e2d8be8ad34f78fc3bb40e3b8b319d6b3f7b94a4aecdf7d3da98b45ca2d2372e8f0d4afcf34e75dba1e1e9d80262d42476f774fc9045d5140957926d3402700feea4dba231b6ff172b1c247dd80e428fec5c940f534c0d034e6e992ba52e98f35638d87a55c73a498f4d6c9076822d9f119d8752888cf3b795c363a10fbe156a04cd16b7976d231940d4f89f20dad3f3b791faffca09e0e561a726403ee1e1fc1e5839b83c2a308d466449e542951605c69e8a30a09916533b622b55985e6f978efa00c32fe5818bd7a4bed7916b000fda50e09cbc321166c5da743b0027c0c2a2748853ccb2dc87b682054d231b98677230e1d2d9d84dd3dfab0544849377a73192b0b716d6833e9ddcff7088326e3c83cf25d66ced84094da0ab7ed1a698c524b689ae2da3947f05273ee58a45bd6e5a75d5c85c2f3f986cd40728a31a1f43351f9dbad57d5c96a0f8cc3c17c8734fab1d47e8826a63681b259479aa57edb756221ecbf965847a7d20780759e33f912422705f2202173ee768a6a7a761f5797cb42f3c0ba097f7c85482037ae816b6fdbe5083e31e9ccb53b85bfab724be57b897cdd64edb9dbb856ac2e7bd211aa877f9850b9a12d10e337f69a47d0f9fcb159b18061f1ac55fe5ce004b0ffed03fd97c898493adbc1751c4d3101f478e457ac53573f0967d1dee5b0897b737ad8866fbb04661602b5ee3f10e88a2d862f37c724b99a4b7f584cf727205e03118cd0edf508fdfe0e00b84b78af9f3e46d6f0dc1581971c02fb1cd13c7187ffd7e097ff04e420295502673684d9becefdaf9a1d9cc006647bd63d52d3f18e2d40b7e7189a30b6fe21ecbef7b384f4a83b7225ede7d372d734c139d8c1b0f150df2fe723b31f739c4d297832bb1ad174cbec5bb6087284d2b4dd329098d08319f7dacfb6c689a492a533aeb3f3a6cb9f5b5b7769d4201d26df5fb32b3a0b04e4c1dd5db4966305f874ad98febdd6a5356c2843d90d85d6537f21d063466e2d7ac5cf88194a960ad58d2fe2bbd1973cab8215f2f267adbc536443ee9f92eb8af255ba7ff43ebad94878346efebbf3228aca70c4a1828edd3b69f5f71af7ec71f799094280875d1bb0581ad453bc3834989e3f02ab42753de84c6df137716a68bce872cc62e71cac7623cdeb85e55aaa23ed32a8008b6926dd3ecb0e4ab5fc679d5a0d1ad09835"	[{"id": "edu-1", "degree": "Master of Science", "current": false, "endDate": "2025", "startDate": null, "description": "", "institution": "California State Polytechnic University, Pomona", "fieldOfStudy": "Hospitality Management"}, {"id": "edu-2", "degree": "Bachelor of Science", "current": false, "endDate": "2022", "startDate": null, "description": "", "institution": "Anjuman-I-Islam, India", "fieldOfStudy": "Hospitality and Tourism Management"}]	{CaterTrax,"Microsoft Excel (Solver","Pivot tables",VLOOKUP),Tableau,"Power BI",SPSS,"Microsoft Suite","Time Management",Presentation,"Effective Communication",Leadership}	{CaterTrax,"Microsoft Excel (Solver, Pivot tables, VLOOKUP)",Tableau,"Power BI",SPSS,"Microsoft Suite"}	{"Time Management",Presentation,"Effective Communication",Leadership}	t	[]	[]	\N	f	details	2025-05-29 16:49:08.504615	2025-05-29 21:01:53.217	[]	{"Soft Skills": ["Time Management", "Presentation", "Effective Communication", "Leadership"], "Technical Skills": ["CaterTrax", "Microsoft Excel (Solver, Pivot tables, VLOOKUP)", "Tableau", "Power BI", "SPSS", "Microsoft Suite"]}
11	31	SDE Google	Senior Software Engineer	Google	About the job\nGoogle's software engineers develop the next-generation technologies that change how billions of users connect, explore, and interact with information and one another. Our products need to handle information at massive scale, and extend well beyond web search. We're looking for engineers who bring fresh ideas from all areas, including information retrieval, distributed computing, large-scale system design, networking and data storage, security, artificial intelligence, natural language processing, UI design and mobile; the list goes on and is growing every day. As a software engineer, you will work on a specific project critical to Google’s needs with opportunities to switch teams and projects as you and our fast-paced business grow and evolve. We need our engineers to be versatile, display leadership qualities and be enthusiastic to take on new problems across the full-stack as we continue to push technology forward.\n\nAt YouTube, we believe that everyone deserves to have a voice, and that the world is a better place when we listen, share, and build community through our stories. We work together to give everyone the power to share their story, explore what they love, and connect with one another in the process. Working at the intersection of cutting-edge technology and boundless creativity, we move at the speed of culture with a shared goal to show people the world. We explore new ideas, solve real problems, and have fun — and we do it all together.\n\nThe US base salary range for this full-time position is $166,000-$244,000 + bonus + equity + benefits. Our salary ranges are determined by role, level, and location. Within the range, individual pay is determined by work location and additional factors, including job-related skills, experience, and relevant education or training. Your recruiter can share more about the specific salary range for your preferred location during the hiring process.\n\nPlease note that the compensation details listed in US role postings reflect the base salary only, and do not include bonus, equity, or benefits. Learn more about benefits at Google.\n\nResponsibilities\nWrite and test product or system development code. \nCollaborate with peers and stakeholders through design and code reviews to ensure best practices amongst available technologies (e.g., style guidelines, checking code in, accuracy, testability, and efficiency,)\nContribute to existing documentation or educational content and adapt content based on product/program updates and user feedback.\nTriage product or system issues and debug/track/resolve by analyzing the sources of issues and the impact on hardware, network, or service operations and quality.\nDesign and implement solutions in one or more specialized ML areas, leverage ML infrastructure, and demonstrate expertise in a chosen field.	professional	68c3a097665d5e2a:aaf99690692f58004d85d3e8a3c631d4:447386d0b2832568ac1718968f3a7891	22578ade22f18200:75b1c5113eb60c8e004601d4f738b393:1dfbd72e48e716102aa45e0dc46cda1e8445f45e15ba574ce656	4945d69a5777c712:189c78d84ad2a16566df93257b2f6c1e:f91f6df5bcd96be56f139365bcec	Los Angeles, CA		Los Angeles	\N	linkedin.com/lahari-sandepudi			"190e3dce61f5d580:b5d1c623d0fc9d94092a4457dc95c254:0cfa499e9c32afe57e72fed859f0c7e814144d02b97bc23675be2f77178289d47669d4d2d6bad0ab9241a220ecbad2bdc749c33b00b39afd8a30081307257e47b113cdccfedf258639a73ee33bb8f6bca1319c4a5ab7b4385b773d45bdeeddd5c14721df23e2fa02d38a7e2b9e616d99a57abf5aa5b9099dcdb49775d705558b7804facdd791c935df9e7f9364d1ff382641a4c5d7a278336b957d65243ddfd1af3caf3d590f87cab0b603b040ca0b59bd00c5572a7406d4171c5da93ae5e2df85817884315b296f9bb43cf7f93741a54202ce7dc8c413fc65ac7d1f1d9f3d37834f87175ce584fdaa0601e6493db5ecfd79009a84aa60523e12736e46dc078b276e25d2ad5f48964b28a1dda336846a5b0d6b557137b9bb61325feef7f4ddcd55366dacecf88ad1dc3f2619526eddbd974e798617799fdced134f5ab7ce1c1bc43febeae1838bcc07d4eebc20cba3f3608d687bdeda927838d04c45253fb8836c6893b67a1d53bf60c058297a471b8bc6d287b0e9923d3a486914f1892fc5a8d06c765b1123e6d8dd55c8344337b1d54af30668c08eb66efddd40db25d2f488c8f9b76f8033ffc3351e0e35dfe81e22da2084376fb1dccabeb3164a5bb64f17721bc594e02df4f7726e9ff96fb59180ab36e59ec055c751f182bad58e99b2b84fc3165ac4331fd94a2889dae15552b3b1b805d14a8be7b42e0e8e3b258e5214af28892e5c28f0805961fcc617bc4cac179712ed70aca0d3c9a13ae861153c7116d6304296bc3e7a771e6751f01979706236eef1b8202ffbc5eb29cc5151cf9838227e466efcc7d1eba80cca1c8ff7e9669413dafa202de43bf0f5ff75d6da6d4a20e5559f010083c502f8c5994d270b5334557be10b376f2e5d12c7ad05e28733a1fd22df4b7111ed7cd49b5076856916d5b1cf0db6e4545bb7de4924545c6f8dcdc240a73a21726cb95893cd87e127ae907513476978580256a697190a0328c00b6e60246b91286f55251745fe3e56055dcb2e314d7586a8d387175c23307a5ed280e56ee7e9580a805055cf36d267122e7c01d04f10dff6219f7cdca9221b335927dccd11baf699773826c344348c2ee380e1d772db2a04a81d27f043231f9afb5cfb6fed2dd98742e88a0d419376bc153a8b3a1cc427981d67b35d349c6b72af35738a32a1aed20237e6a50cfafc1c6c47926599f23f957cbc2cb634f58c9764ff9f834c410f215d0001c0d09ebd3b3eeb6835641683e9ac66ed1e3ecb57874821de6c4f48e750c1f3c7e93ab61259154b583f0f9931ae233c0c0baebc8f7042a63ee13376e2de9a9d24da759e435c2c98636b7f3cedcc123209b116a3107785fd375f7175eddf6bb641cba965bfd1e2af6c75d4588805edd54193f76d6aa7216044b1a16098b9e552db19cb7d1b5cd72ba1eef51a3d8e16a7d91e29083aaf002bdffdc3cbf72581e25cd66264c8babf64801202a72f9c6efa54ae07ce54bda4df1190e4c7c79c6e2f52956b0941da9b80708e3aa615e33b0547de3ad49430cfa9841168d612995ab1645c4182e86f8bcc10b8bb0f349b185a54ef74dfe4f423dd157e1d2aae2d1728fdc282cf168eeeeb1abdc18c7db1349d736d40298e5788520f3b3c0bbdb60fc621aef718f7272e95861f3c5364a5a8a0fdd34aa042bcaa46e19cb052bb2e41b689911af4ba88788f3b89f011f91815b0b78c98db7593f92e795cfb583eab816af16a7150e6dfd9c85c85a39eee225fb067ca812154981a7b69870bcb9c5c6e3629c39f56a831e6e8d6ab8b3d705c85af83977dfc523c678c3d506e977984682f561713fb7a8ac02c3d41ab2bb137690a3612c695af70dee051850b81df303454bbbe61b351fac165be24f809bd08b9291be7e1f7a265fac0e5812af6f6bb477c17484c61836a259ad0153219126362456a4185ae519988fc4609f2ff444642a44ef8aa9b72ad3fe0eaa1982c4c5dc14c6abb35b49ec6cdae4299676b72577dddc013fa52cc8c774ac85264ce7f931141986faa7442f2c8b48469b44b7b698103f7da9f33cd8f08562c8abf0a83d3026c4075b520dfbbb6a568b2187fdb9d890600d2e1191645468c058308e8e9a3f7e4640f0b24db511217a5821287af38077214fb0472218516f4644f7ec3ebfaf05fb9748c7d346918b17da4fef14ff7f66fbc5a1a67889eb39afc449b65b8a3bee4286edc3ca28b50a3dce21777f08d4a4d621c523e71ff1800555824375fdda75057c1a71e530c5ea62823186ec612"	[{"id": "edu-1", "degree": "Master of Science", "current": true, "endDate": "2025", "startDate": "2023", "description": "GPA: 4.0/4.0, Coursework: Data Structures, Algorithms, Machine Learning, Software Engineering, Cloud Computing", "institution": "California State Polytechnic University", "fieldOfStudy": "Computer Science"}]	{}	{Python,C++,JavaScript,SQL,ServiceNow,Git,Docker,Postman,Html,CSS,ReactJS,Angular,Next.js,Node.js,Django,"Restful APIs",AWS,"Google Cloud Platform (GCP)",Azure,"Google Firebase",NumPy,Pandas,"Scikit Learn",NLTK,NLP,Matplotlib,Seaborn}	{}	t	[{"id": "cert-1", "date": null, "name": "ServiceNow CSA (Certified System Administrator)", "issuer": "", "expires": false, "expiryDate": null}, {"id": "cert-2", "date": null, "name": "CAD (Certified Application Developer)", "issuer": "", "expires": false, "expiryDate": null}]	[{"id": "proj-1", "url": null, "name": "Fake News Detection using Machine Learning Algorithms", "current": false, "endDate": null, "startDate": null, "description": "Developed a fake news detection system using ML algorithms like k-NN, Random Forest, Decision Tree, Gradient Boosting, and Passive Aggressive on a 6,335-article dataset from past elections. Implemented NLP and machine learning classifiers, achieving up to 94.47% accuracy with Passive Aggressive algorithm, enhancing the reliability of digital media information integrity.", "technologies": ["Python", "NLP"]}, {"id": "proj-2", "url": null, "name": "Hotel Booking Chatbot", "current": false, "endDate": null, "startDate": null, "description": "Engineered an Amazon Lex chatbot for real-time hotel reservations, enhancing user engagement with NLU. Integrated AWS Lambda for backend logic execution, optimizing database queries to efficiently handle large-scale user requests for room availability, ensuring accurate and responsive bookings.", "technologies": ["Amazon Lex", "AWS Lambda"]}, {"id": "proj-3", "url": null, "name": "Track Navigation Training for Racing", "current": false, "endDate": null, "startDate": null, "description": "Fine-tuned a Deep Racer model using Python and Reinforcement Learning, optimizing reward functions and hyperparameters to improve lap times, stability, and track navigation efficiency compared to baseline models.", "technologies": ["Python", "AWS DeepRacer"]}]	\N	f	details	2025-05-23 04:58:56.102546	2025-05-23 09:07:19.658	\N	{"Technical Skills": ["Python", "C++", "JavaScript", "SQL", "ServiceNow", "Git", "Docker", "Postman", "Html", "CSS", "ReactJS", "Angular", "Next.js", "Node.js", "Django", "Restful APIs", "AWS", "Google Cloud Platform (GCP)", "Azure", "Google Firebase", "NumPy", "Pandas", "Scikit Learn", "NLTK", "NLP", "Matplotlib", "Seaborn"]}
6	1	Guy Hembroff	Health Systems Science Research Faculty	Kaiser Permanente	Health Systems Science Research Faculty-School Of Medicine\n\nPrimary Location Pasadena, California\nWorker Location Flexible\nJob Number 1295305\nDate posted  02/26/2025\nSubmit Interest\nSave Job\nDescription:\nJob Summary:\n\nThe Department of Health Systems Science (HSS) at the Kaiser Permanente Bernard J. Tyson School of Medicine (KPSOM) seeks to expand our research capacity, particularly in three priority areas of inquiry: learning health systems (including embedded research and implementation and improvement science), health information technology (including clinical informatics and healthcare applications of artificial intelligence), and health equity (including health disparities and social and structural drivers of health). Applications will be considered for faculty positions at the Instructor, Assistant Professor, Associate Professor, and Professor levels. We aim to recruit faculty members who share our enthusiasm for building a research enterprise that emphasizes innovation and excellence within a new and growing school of medicine that highly values inclusion and diversity. Our conceptualization of the health system extends into the community and embraces engaged and partnered approaches. \nThe HSS mission includes: 1) the pursuit of a broad scholarship agenda that will improve health, health care, and health equity through systems transformation and redesign; and 2) delivery of an innovative foundational curriculum in four domains: community and population health, health care and social systems, quality and safety, and research methods to inform evidence-based clinical practice. While this recruitment prioritizes hiring faculty members to support the Departments scholarship mission, faculty will also be expected to contribute significantly to student teaching and research mentorship.\n\nEssential Responsibilities:\n\nDevelop and/or expand a program of externally funded research in one or more of the core domains of learning health systems, health information technology, or health equity.\nSupport and serve as a mentor to KPSOM students as they pursue both required and ancillary scholarly projects.\nEstablish productive collaborations with current HSS faculty members in one or more of the above areas of thematic interest.\nIdentify opportunities to partner with health system leaders to address health system priorities using diverse research methods and approaches.\nEngage in scholarly activities in clinical and community settings, including health services and health-related social sciences research; improvement and implementation research; and health-related program and policy development and evaluation.\nServe as presenters and facilitators in large, medium, and small group learning sessions.\nContribute to ongoing development, revision, and refinement of the HSS curriculum.\nScholarly and pedagogical duties, expectations, and resources will be individually developed based on evolving faculty interests, skills, departmental priorities, and needs.\nBasic Qualifications:\nExperience\nN/A\nEducation\nMD, PhD, other doctoral degree, or comparable degree.\nLicense, Certification, Registration\nN/A\nAdditional Requirements:\nDemonstrated ability or potential to obtain funding from diverse sources, including National Institutes of Health (NIH), Patient Centered Outcomes Research Institute (PCORI), private foundations, and industry, preferred.\nConfirmed track record of first or senior author publication in journals of clinical medicine, population health, and health care research, preferred.\nDemonstrated outstanding teaching abilities and commitment to teaching, preferred.\nProven service in disadvantaged communities, preferred.\nDemonstrated health-related scholarly experience in one of the following or related fields of study: artificial intelligence/machine learning, clinical informatics, delivery system science, economics, embedded research, health equity, health policy, health services, implementation science, improvement science, management science, outcomes and comparative effectiveness research, public health, sociology, statistics, or systems engineering.\nProven strong collaboration and communication skills.\nDemonstrated strong critical thinking, leadership, and organizational skills.\nEstablished a strong commitment to equity, inclusion, and diversity.\nPreferred Qualifications:\nN/A\nPrimary Location: California,Pasadena,S. Los Robles Administration\nScheduled Weekly Hours: 40\nShift: Day\nWorkdays: Mon, Tue, Wed, Thu, Fri\nWorking Hours Start: 08:00 AM\nWorking Hours End: 04:30 PM\nJob Schedule: Full-time\nJob Type: Standard\nWorker Location: Flexible\nEmployee Status: Regular\nEmployee Group/Union Affiliation: NUE-PO-01|NUE|Non Union Employee\nJob Level: Individual Contributor\nDepartment: SCHOOL OF MEDICINE - Research Administration - 9201\nPay Range: $130500 - $260040 / year\nKaiser Permanente strives to offer a market competitive total rewards package and is committed to pay equity and transparency. The posted pay range is based on possible base salaries for the role and does not reflect the full value of our total rewards package. Actual base pay determined at offer will be based on labor market data and a candidate's years of relevant work experience, education, certifications, skills, and geographic location.\nTravel: Yes, 5 % of the Time	elegant-divider	c3c57e30a427449e:da7e97f998ad5b2e8bef8994b8b1565a:73d99918587e62df57cf72cf	3d66cfe34914ab52:2c4bc6cc903670800748999add273d6a:c0ce7e79f6cf3f8d6933c1cd9b6ec3ca21d3cfce203e	7f62f397dfa28ebf:106a0c48f9638f49c2e9ce0f7c19d54d:7a72ec439df141638f			Houghton	MI	https://linkedin.com/in/guy-hemborff	https://hembroff.com	7d49b2f5ee8872d4:7707af79b500f1c5d1c0891a7ee3d19f:9f9302af14c047f80b020be5d1668cfd6cdebc81c4a83c9ca4fb47afd0572379b1793587284d85fd5815f4119b0cdec119411a094afeb94539ecabba40033bf3a32e6ddeb9cced822474bde0b8b52c22247cbbd50946a6037c14f39ee813be07d0360f8ea3b137eedd6c0fc60023b92bde5ae5480c43834925ac0cd074cb05c4e2f7adf203af99450551cf084e664690e0bd564c02eee02fa8bbd39c3f1429ea4bde5e0a97eda09306119114d3c50a9118d277e3f6b0e64ad1a94111bf943176578d8060479bbc592b256a9eb42176ff1ca0043c8d25ca2774f51ffd2be9979ac0b64da2e3b0ac0feed3c22f33fbe471993d84e2ee21d8dc19327ea372559bf20df3ec5145a71a0e2ada9552c2abc5822f7299c97e3d4d742f8dd5c5083bb2f4f5c1504c998d	[]	[{"id": "1746221046385", "city": "", "degree": "Masters", "country": "", "current": false, "endDate": "2025-05-02", "startDate": "2024-03-01", "description": "", "institution": "University of California", "fieldOfStudy": "Computer Sicence"}]	{"learning health systems","embedded research","implementation and improvement science","clinical informatics","healthcare applications of artificial intelligence","systems transformation and redesign","evidence-based clinical practice",Javascript,Java,NodeJS,HTML,CSS,Python}	{"learning health systems","embedded research","implementation and improvement science","clinical informatics","healthcare applications of artificial intelligence","systems transformation and redesign","evidence-based clinical practice"}	{enthusiasm,inclusion,diversity,"develop and/or expand a program of externally fund","support the Departments scholarship mission"}	t	[]	[]		f	details	2025-05-02 17:18:13.754757	2025-06-04 01:45:07.294	[{"id": "1748592425355", "url": "https://doi.com/98791231/", "title": "Testing publication", "authors": "Dr. James", "publisher": "journal of test", "description": "Abstract for testing", "publicationDate": "2025-04-30"}, {"id": "1748594164912", "url": "", "title": "another publication", "authors": "Yes this is", "publisher": "This is another publication", "description": "", "publicationDate": "2025-05-22"}]	{"Database": ["My SQL", "PostgreSQL", "NO SQL", "Firebase"], "Software": ["learning health systems", "embedded research", "implementation and improvement science", "clinical informatics", "healthcare applications of artificial intelligence", "systems transformation and redesign", "evidence-based clinical practice"], "Programming Languages": ["Javascript", "Java", "NodeJS", "HTML", "CSS", "Python"]}
14	1	Data Analyst Healthcare Operations	Data Analyst - Healthcare Operations	Apple Health	We are seeking a detail-oriented and analytical Data Analyst to support our healthcare operations team. The ideal candidate will have experience working with large datasets, proficiency in SQL and Python, and a passion for using data to improve patient outcomes. Responsibilities include preparing reports and dashboards, collaborating with clinical teams, and supporting quality improvement initiatives.\n\nKey Responsibilities:\n\nClean, analyze, and interpret healthcare data using SQL and Python\nDevelop dashboards and visualizations using tools like Power BI or Tableau\nAssist in the identification of care gaps and operational inefficiencies\nWork with interdisciplinary teams to support performance improvement\nConduct exploratory data analysis and provide actionable insights\nRequirements:\n\nBachelor’s degree in Data Science, Public Health, Health Informatics, or a related field\n1–3 years of experience in data analysis or healthcare analytics\nProficiency in SQL and one scripting language (Python preferred)\nExperience with data visualization platforms (Power BI, Tableau, etc.)\nFamiliarity with HIPAA and healthcare data standards is a plus	modern-sidebar	dcd2eb8bb19b5316:2cfabddba677cb322fce81e37a678778:750ec2b7da50b2d9324345b45c31bc	6cd279174ee5b03a:eae25f0161467d1426f8e1af3f4b102b:664a0bcba556ef2656901b5b47fe18fe5b150f30cf0e3a861d2282	8472c42d619007f9:9d79c0547c7b07a2f2934a085b9d3420:b2e2474fdc25d3aeb3a7972252dd			Chicago	IL	https://linkedin.com/in/samantharaynor	https://samantharaynor.dev	60411f0e9cb3973b:1578f72d01fecbb9f880f7da12e85d55:23db2f6b8d32bff60c4d55510098e0a145db4cee86c0f9e5baec5bf94295eb0ecf875796ca561748330e7f254892eacd49ab39977f3730f33c4460776f3067fab5edca57dac8c96be173f08954969255e317756b9e0499a48101857005e7eb972f74009b0228350f753fbc29cdcafaba795df8ac9699de6f5ab0c45789c223ffb419d28448d8c66f9d32a0d34e553429c2d84324af8757a0a8287cc0cb0c5718bb0c5c85b5605387db153d9dd9790774543c246d68c7457d7764a227a0ac36b46cbb926ecd5414397591a57a9acbaa68516d3f9775268aded826407bf52497a3f3981d393187087e2842	[]	[{"id": "1748644845715", "city": "", "degree": "Master of Science", "country": "", "current": false, "endDate": "2023-05-09", "startDate": "2021-08-11", "description": "", "institution": "University of Illinois at Chicago", "fieldOfStudy": "Health Informatics"}, {"id": "1748644916346", "city": "", "degree": "Bachelor of Science", "country": "", "current": false, "endDate": "2020-09-18", "startDate": "2016-08-08", "description": "", "institution": "Loyola University Chicago", "fieldOfStudy": "Biology"}]	{}	{SQL,Python,"Data Analysis","Healthcare Analytics","Data Visualization","Power Bi",Tableau,"Exploratory Data Analysis","Quality Improvement Initiatives","Performance Improvement",R,"Microsoft Excel",Sas,"Healthcare Data Analytics","Statistical Analysis","Data Mining"}	{Detail-oriented,Analytical,Collaborating,"Develop Dashboards and Visualizations","Analytical Thinking",Problem-solving,"Attention to Detail","Communication Skills","Team Collaboration","Time Management",Adaptability,"Critical Thinking","Project Management","Stakeholder Engagement"}	t	[{"id": "1748645255751", "url": "", "date": "2023-07-05", "name": "Certified Health Data Analyst (CHDA)", "issuer": "American Health Information Management Association (AHIMA)", "expires": false, "expiryDate": "", "description": ""}, {"id": "1748645277338", "url": "", "date": "2023-01-30", "name": "HIPAA for Healthcare Professionals", "issuer": "Udemy", "expires": false, "expiryDate": "", "description": ""}]	[{"id": "1748645154593", "url": "https://samantharaynor.dev/readmission-risk", "date": "", "name": "Predicting Patient Readmission Risk", "current": false, "endDate": "2023-03-05", "startDate": "2023-01-01", "description": "Used logistic regression to identify patients at high risk of 30-day hospital readmission.", "technologies": ["Python", "Scikit-learn", "Pandas", "Jupyter"]}]		f	details	2025-05-30 18:34:19.775058	2025-06-04 08:36:09.497	[{"id": "1748646414294", "url": "https://10.1016/j.jbi.2023.104352", "title": "Predictive Modeling for 30-Day Hospital Readmission in Diabetic Patients", "authors": "Samantha Raynor, Dr. Alan Chen, Priya Mehta", "publisher": "Journal of Biomedical Informatics", "description": "", "publicationDate": "2023-03-04"}, {"id": "1748646475216", "url": "https://10.2196/32789", "title": "Evaluating NLP Techniques for Analyzing Patient Sentiment in Post-Discharge Surveys", "authors": "Samantha Raynor, Dr. Lisa Kim", "publisher": "JMIR Medical Informatics", "description": "", "publicationDate": "2022-10-20"}]	{"Soft Skills": ["Detail-oriented", "Analytical", "Collaborating", "Develop Dashboards and Visualizations", "Analytical Thinking", "Problem-solving", "Attention to Detail", "Communication Skills", "Team Collaboration", "Time Management", "Adaptability", "Critical Thinking", "Project Management", "Stakeholder Engagement"], "Technical Skills": ["SQL", "Python", "Data Analysis", "Healthcare Analytics", "Data Visualization", "Power Bi", "Tableau", "Exploratory Data Analysis", "Quality Improvement Initiatives", "Performance Improvement", "R", "Microsoft Excel", "Sas", "Healthcare Data Analytics", "Statistical Analysis", "Data Mining"]}
\.


--
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: raja
--

COPY public.session (sid, sess, expire) FROM stdin;
elyVucXpY7TYDj3TW9HIezHxjaZExUqt	{"cookie": {"path": "/", "secure": false, "expires": "2025-06-05T02:26:22.914Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 86400000}, "sessionTestData": {"counter": 1, "createdAt": "2025-06-04T02:26:22.913Z", "sessionId": "elyVucXpY7TYDj3TW9HIezHxjaZExUqt"}}	2025-06-05 02:26:23
KFUurrP0Kbm_7Qknm29PqBU0DIKftiR7	{"cookie": {"path": "/", "secure": false, "expires": "2025-06-05T02:27:40.282Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 86400000}, "sessionTestData": {"counter": 2, "createdAt": "2025-06-04T02:27:09.314Z", "sessionId": "KFUurrP0Kbm_7Qknm29PqBU0DIKftiR7", "lastAccessed": "2025-06-04T02:27:40.282Z"}}	2025-06-05 02:27:41
mXLPiJTQKpueeUip2i3DA3gpxla0gXhE	{"cookie": {"path": "/", "secure": false, "expires": "2025-06-05T01:55:12.436Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 86400000}, "passport": {"user": 1}, "createdAt": 1749001323030, "lastActivity": 1749002112434}	2025-06-05 01:55:13
zWT3UKDUDF4FFTjKwxiC7EEKfkLiCvT4	{"cookie": {"path": "/", "secure": false, "expires": "2025-06-05T01:35:16.075Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 86400000}, "passport": {"user": 1}, "createdAt": 1749000676332, "lastActivity": 1749000916073}	2025-06-05 01:35:17
etusXMNZ6EfhpUquNhiJ8SxwDHxquWI0	{"cookie": {"path": "/", "secure": false, "expires": "2025-06-05T03:41:41.386Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 86399999}, "passport": {"user": 1}, "createdAt": 1749006395825, "lastActivity": 1749008501385}	2025-06-05 03:41:42
phfmkl615GLdGMtWxJNTWIa4jyJa4aXk	{"cookie": {"path": "/", "secure": false, "expires": "2025-06-05T02:14:44.189Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 86400000}, "passport": {"user": 1}, "createdAt": 1749002637936, "lastActivity": 1749003284186}	2025-06-05 02:14:45
CDSgiNfYtQuMU0SfJXm82BEzvZYkeuLn	{"cookie": {"path": "/", "secure": false, "expires": "2025-06-05T23:37:21.016Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 86399963}, "passport": {"user": 1}, "createdAt": 1749025919983, "lastActivity": 1749080241050}	2025-06-05 23:37:22
\.


--
-- Data for Name: smtp_settings; Type: TABLE DATA; Schema: public; Owner: raja
--

COPY public.smtp_settings (id, host, port, username, password, encryption, sender_name, sender_email, enabled, created_at, updated_at) FROM stdin;
1	md-in-67.webhostbox.net	465	no-reply@atscribe.com	0G*=kq(7b9Q5	ssl	atScribe	no-reply@atscribe.com	t	2025-05-17 17:04:36.454764	2025-05-17 21:33:03.07
\.


--
-- Data for Name: subscription_plans; Type: TABLE DATA; Schema: public; Owner: raja
--

COPY public.subscription_plans (id, name, description, price, billing_cycle, is_featured, is_freemium, active, created_at, updated_at) FROM stdin;
8	Entry	Perfect for those who want to try out the features that atscribe offering	0.00	MONTHLY	f	t	t	2025-05-16 02:34:22.919792	2025-05-16 02:34:22.919792
4	Starter	Perfect for job seekers taking their first step toward a standout application	0.00	MONTHLY	f	f	t	2025-04-23 16:14:52.460846	2025-04-23 16:14:52.460846
6	Elite	Tailored for ambitious professionals and career changers who want to stand out in every application	0.00	MONTHLY	f	f	t	2025-04-23 17:47:02.675766	2025-04-23 17:47:02.675766
5	Pro	Designed for professionals or active job hunters who want more flexibility and higher usage limits	0.00	MONTHLY	t	f	t	2025-04-23 17:45:53.288605	2025-04-23 17:45:53.288605
\.


--
-- Data for Name: tax_settings; Type: TABLE DATA; Schema: public; Owner: raja
--

COPY public.tax_settings (id, name, type, percentage, country, state_applicable, enabled, apply_to_region, apply_currency, created_at, updated_at) FROM stdin;
11	GST	GST	18.00	IN	\N	t	INDIA	INR	2025-05-19 20:42:46.735535	2025-05-21 00:59:56.76
\.


--
-- Data for Name: two_factor_authenticator; Type: TABLE DATA; Schema: public; Owner: raja
--

COPY public.two_factor_authenticator (id, user_id, secret, recovery_codes, verified, created_at, updated_at) FROM stdin;
1	1	LBECSMRFH4ZVEJDYO5JHSLZ2PJREGR2X	["7475-6D3E-E8B0", "CDF1-BEB2-A55F", "CEFE-D6F8-126E", "6C26-F09A-E646", "9641-FC9C-8E4E", "97A5-D4DB-DFC4", "2274-84A5-6B57", "5E8D-13C7-0012", "214D-7F15-7DC0", "CC01-527A-E748"]	t	2025-05-23 18:10:51.523034	2025-05-25 02:06:29.563
\.


--
-- Data for Name: two_factor_backup_codes; Type: TABLE DATA; Schema: public; Owner: raja
--

COPY public.two_factor_backup_codes (id, user_id, code, used, created_at) FROM stdin;
11	1	7475-6D3E-E8B0	f	2025-05-24 22:06:29.569917
12	1	CDF1-BEB2-A55F	f	2025-05-24 22:06:29.569917
13	1	CEFE-D6F8-126E	f	2025-05-24 22:06:29.569917
14	1	6C26-F09A-E646	f	2025-05-24 22:06:29.569917
15	1	9641-FC9C-8E4E	f	2025-05-24 22:06:29.569917
16	1	97A5-D4DB-DFC4	f	2025-05-24 22:06:29.569917
17	1	2274-84A5-6B57	f	2025-05-24 22:06:29.569917
18	1	5E8D-13C7-0012	f	2025-05-24 22:06:29.569917
19	1	214D-7F15-7DC0	f	2025-05-24 22:06:29.569917
20	1	CC01-527A-E748	f	2025-05-24 22:06:29.569917
\.


--
-- Data for Name: two_factor_email; Type: TABLE DATA; Schema: public; Owner: raja
--

COPY public.two_factor_email (id, user_id, email, token, token_expires_at, created_at, updated_at) FROM stdin;
1	1	rajamuppidi@futureaiit.com	\N	\N	2025-05-23 18:31:00.075726	2025-05-25 02:04:28.849
\.


--
-- Data for Name: two_factor_policy; Type: TABLE DATA; Schema: public; Owner: raja
--

COPY public.two_factor_policy (id, enforce_for_admins, enforce_for_all_users, allowed_methods, remember_device_days, created_at, updated_at) FROM stdin;
1	t	t	["EMAIL", "AUTHENTICATOR_APP"]	30	2025-05-23 17:59:42.177108	2025-05-23 22:04:23.391
\.


--
-- Data for Name: two_factor_remembered_devices; Type: TABLE DATA; Schema: public; Owner: raja
--

COPY public.two_factor_remembered_devices (id, user_id, device_identifier, token, expires_at, created_at) FROM stdin;
1	1	a3858c5-xh5ht6c8	2a49cc831b8046123040f5ef527049f01da9f341568b919b3d4e2bbad6f6aa81	2025-06-24 02:04:28.854	2025-05-24 22:04:28.856303
2	1	40ede7bb-5wosq5bi	3fc0fb06b888122d1b2fe974a5035bd6833ed5f33774b81f3dc3b92136de21a5	2025-06-28 04:22:08.351	2025-05-29 00:22:08.352493
3	1	3679f262-dwzzvb5d	fdbd5100836fc12533f6bcbf621788c98aff19175cd951d132dcdd87f7d0113b	2025-07-04 01:42:12.126	2025-06-04 01:42:12.128038
\.


--
-- Data for Name: user_billing_details; Type: TABLE DATA; Schema: public; Owner: raja
--

COPY public.user_billing_details (id, user_id, country, address_line_1, address_line_2, city, state, postal_code, phone_number, tax_id, company_name, created_at, updated_at, full_name) FROM stdin;
11	19	US	1801 Woodmar dr	Apt F	Houghton	Michigan	41906				2025-05-14 18:44:10.581771	2025-05-14 18:44:10.581771	Peter 
12	20	US	342 Glasere SA	Apt 455	Houghton	Michigan	40092				2025-05-14 21:18:15.777287	2025-05-14 21:18:15.777287	Sukumar
13	21	US	1244 Gmart Ave	Deir	Sierra Vista	Arizona	85635				2025-05-15 13:51:31.22257	2025-05-15 13:51:31.22257	Bhuvana Murki
16	28	US	f25668d2f7069273:2dae924e5d406d820aee8250d528f528:7e4726a9148b8e4cbc8c9ea0ef75		Glendale	CA	91206	9b2b72b32839f74e:2fb86bb025fe73ba1b04450610f1f5f0:095532f522ddbd66b200c0ea			2025-05-19 04:01:22.139704	2025-05-19 18:50:11.282	1bd58b63c16925fc:e31d114a84223a22f93144be5cde3036:efbabb5cbf883b6ca4e1b0
17	29	IN	9ff1c047ebf8b71b:bc28b642616d9c4e612e6f41f370f80d:bd10ffb43c97f062dbcc9af8a80afecfe3545f3b		Pithapuram	AP	533450	8388dcb90550de33:9263b14e88d9fed4ff4e10fdf42a6651:81b37a4672e47bcc46655482a7			2025-05-19 19:51:57.284465	2025-05-21 07:04:40.334	f0703269b41eb5cd:1a08cd8e320e438374a7d2b56ca5af59:7b0b94e80d9e773db07f2dbd1ef1e8
18	1	US	8b8d492d00670b81:d6977abfe70e688142348479763c94d4:94d6c0c14aa2c27c956073773533f78f		Glendale	CA	91206				2025-05-19 21:02:37.734939	2025-05-23 22:25:25.77	c6e3e686e2dcc17e:e35a5bfbf8ae0bc893924f8447f4d561:4ab07073846096ae1355612d
10	18	US	06c4df41b9ca628c:8865e9933115da48a08816f972ac8c23:3cc06c005121dad79fdfd8d7f6487205	cc08b3fa0b3a409f:0a3a551a310771758947507a40726ec8:43c0ad50d4b845	Glendale	CA	91206	0f4c1a9fa0aeb719:ee305c3d8dbeae7346aca66137145dbf:302139fda42f1e7111ad			2025-05-14 17:39:55.486139	2025-06-04 07:17:13.853	62dbd9832570c655:7c4b77c83af8a384327976c879076ba5:ccf2a4c00b8d99
\.


--
-- Data for Name: user_subscriptions; Type: TABLE DATA; Schema: public; Owner: raja
--

COPY public.user_subscriptions (id, user_id, plan_id, start_date, end_date, auto_renew, payment_gateway, payment_reference, status, is_trial, trial_expiry_date, converted_from_trial, grace_period_end, previous_plan_id, upgrade_date, created_at, updated_at, cancel_date, pending_plan_change_to, pending_plan_change_date, pending_plan_change_type, metadata) FROM stdin;
22	19	6	2025-05-14 23:58:24.306	2025-06-14 23:58:24.306	f	RAZORPAY	sub_QUzxU3gVgTGPIs	CANCELLED	f	\N	f	\N	5	2025-05-14 23:58:24.306	2025-05-14 19:58:24.309339	2025-05-14 23:58:49.36	2025-05-14 23:58:49.36	\N	\N	\N	{"replacedBy": 23, "planChangeHistory": {"date": "2025-05-14T23:58:24.306Z", "newPlanId": 6, "paymentId": "pay_QUzyDXFYk9GOBm", "newPlanName": "Elite", "previousPlanId": 5, "fullPriceCharged": true, "previousPlanName": "Pro", "noProrationPolicy": true}, "cancellationReason": "Cancelled due to downgrade to Starter"}
23	19	4	2025-05-14 23:58:49.36	2025-06-14 23:58:49.36	f	RAZORPAY	\N	CANCELLED	f	\N	f	\N	6	2025-05-14 23:58:49.36	2025-05-14 19:58:52.26052	2025-05-15 00:05:34.941	2025-05-15 00:05:34.941	\N	\N	\N	{"replacedBy": 24, "planChangeHistory": {"date": "2025-05-14T23:58:49.360Z", "type": "DOWNGRADE", "newPlanId": 4, "newPlanName": "Starter", "previousPlanId": 6, "fullPriceCharged": true, "previousPlanName": "Elite", "noProrationPolicy": true}, "cancellationReason": "Cancelled due to plan change to Elite"}
32	28	4	2025-05-20 22:20:05.558	2025-06-20 22:20:05.558	t	RAZORPAY	sub_QXLTRuyAqwP5ms	ACTIVE	f	\N	f	\N	\N	\N	2025-05-20 18:20:05.559452	2025-05-20 18:20:05.559452	\N	\N	\N	\N	{"initialActivation": {"date": "2025-05-20T22:20:05.558Z", "planId": 4, "planName": "Starter", "paymentId": "pay_QXLV7TsvCnTkvR"}}
24	19	6	2025-05-15 00:05:34.941	2025-06-15 00:05:34.941	t	RAZORPAY	sub_QV05DCrgh3A2rL	ACTIVE	f	\N	f	\N	4	2025-05-15 00:05:34.941	2025-05-14 20:05:34.945649	2025-05-15 00:06:09.702	\N	\N	\N	\N	{"pendingDowngrade": {"date": "2025-05-15T00:05:42.255Z", "newPlanId": 4, "newPlanName": "Starter", "effectiveDate": "2025-06-15T00:05:34.941Z", "previousPlanId": 6, "previousPlanName": "Elite"}, "planChangeHistory": {"date": "2025-05-15T00:05:34.941Z", "newPlanId": 6, "paymentId": "pay_QV05q44fHQzL1q", "newPlanName": "Elite", "previousPlanId": 4, "fullPriceCharged": true, "previousPlanName": "Starter", "noProrationPolicy": true}}
2	1	5	2025-04-23 22:56:35.552	2025-05-23 22:56:35.552	f	MANUAL	ADMIN_ASSIGNED	CANCELLED	f	\N	f	\N	4	\N	2025-04-23 22:48:52.625	2025-04-23 22:48:52.625	\N	\N	\N	\N	{}
3	1	4	2025-04-23 22:49:46.042	2025-04-23 23:00:53.12	f	MANUAL	ADMIN_ASSIGNED	CANCELLED	f	\N	f	\N	\N	\N	2025-04-23 22:49:46.042	2025-04-23 22:49:46.042	\N	\N	\N	\N	{}
4	1	5	2025-04-23 23:00:53.122	2026-04-23 23:00:53.122	f	MANUAL	ADMIN_ASSIGNED	CANCELLED	f	\N	f	\N	\N	\N	2025-04-23 23:00:53.123	2025-04-23 23:00:53.123	\N	\N	\N	\N	{}
1	1	4	2025-04-23 22:50:03.949	2025-04-23 23:03:25.296	f	MANUAL	ADMIN_ASSIGNED	CANCELLED	f	\N	f	\N	4	\N	2025-04-23 22:39:25.18	2025-04-23 22:39:25.18	\N	\N	\N	\N	{}
37	32	6	2025-05-29 20:57:12.04	2026-05-29 20:57:12.04	f	NONE	ADMIN_ASSIGNED	ACTIVE	f	\N	f	\N	\N	\N	2025-05-29 20:57:12.04	2025-05-29 20:57:12.04	\N	\N	\N	\N	{}
25	20	5	2025-05-15 01:29:50.748	2025-06-15 01:29:50.748	t	RAZORPAY	sub_QV1W0JNq2cOk7s	ACTIVE	f	\N	f	\N	\N	\N	2025-05-14 21:29:50.750252	2025-05-14 21:29:50.750252	\N	\N	\N	\N	{"initialActivation": {"date": "2025-05-15T01:29:50.748Z", "planId": 5, "planName": "Pro", "paymentId": "pay_QV1WoyCgCY23iO"}}
27	23	8	2025-05-16 06:40:12.383	2025-06-16 06:40:12.383	t	NONE	free_1747377612384	ACTIVE	f	\N	f	\N	\N	\N	2025-05-16 06:40:12.383	2025-05-16 06:40:12.383	\N	\N	\N	\N	{"freemiumActivation": {"date": "2025-05-16T06:40:12.383Z", "activationType": "new_subscription"}}
28	24	8	2025-05-17 23:16:16.843	2025-06-17 23:16:16.843	t	NONE	free_1747523776843	ACTIVE	f	\N	f	\N	\N	\N	2025-05-17 23:16:16.843	2025-05-17 23:16:16.843	\N	\N	\N	\N	{"freemiumActivation": {"date": "2025-05-17T23:16:16.843Z", "activationType": "new_subscription"}}
26	21	6	2025-05-15 17:52:32.904	2025-06-15 17:52:32.904	f	RAZORPAY	sub_QVIG6dAuP0UXXn	CANCELLED	f	\N	f	\N	\N	\N	2025-05-15 13:52:32.905053	2025-05-20 19:51:32.418	\N	\N	\N	\N	{"initialActivation": {"date": "2025-05-15T17:52:32.904Z", "planId": 6, "planName": "Elite", "paymentId": "pay_QVIGtXTXkm93W8"}}
35	31	8	2025-05-23 08:53:23.715	2025-06-23 08:53:23.715	t	NONE	free_1747990403715	ACTIVE	f	\N	f	\N	\N	\N	2025-05-23 08:53:23.715	2025-05-23 08:53:23.715	\N	\N	\N	\N	{"freemiumActivation": {"date": "2025-05-23T08:53:23.715Z", "activationType": "new_subscription"}}
34	29	6	2025-05-21 01:06:10.968	2025-06-21 01:06:10.968	f	RAZORPAY	sub_QXOKLuEFjSU4Ko	CANCELLED	f	\N	f	\N	\N	\N	2025-05-20 21:06:10.970358	2025-05-29 08:29:58.392	2025-05-29 08:29:58.392	\N	\N	\N	{"initialActivation": {"date": "2025-05-21T01:06:10.968Z", "planId": 6, "planName": "Elite", "paymentId": "pay_QXOKdNQ3l8lNIY"}}
15	13	6	2025-05-07 21:43:01.05	2026-05-07 21:43:01.05	f	MANUAL	ADMIN_ASSIGNED	ACTIVE	f	\N	f	\N	\N	\N	2025-05-07 21:43:01.05	2025-05-07 21:43:01.05	\N	\N	\N	\N	{}
36	32	8	2025-05-29 20:47:51.684	2025-06-29 20:47:51.684	f	NONE	free_1748551671684	CANCELLED	f	\N	f	\N	\N	\N	2025-05-29 20:47:51.684	2025-05-29 20:56:59.821	\N	\N	\N	\N	{"freemiumActivation": {"date": "2025-05-29T20:47:51.684Z", "activationType": "new_subscription"}}
21	19	5	2025-05-14 23:08:34.01	2025-06-14 23:08:34.01	f	RAZORPAY	sub_QUz6dYK2VgHBxg	CANCELLED	f	\N	f	\N	\N	\N	2025-05-14 19:08:34.011443	2025-05-14 23:58:24.306	2025-05-14 23:58:24.306	\N	\N	\N	{"replacedBy": 22, "cancellationReason": "Cancelled due to plan change to Elite"}
5	1	5	2025-04-23 23:03:25.298	2025-05-23 23:03:25.298	f	MANUAL	ADMIN_ASSIGNED	ACTIVE	f	\N	f	\N	\N	\N	2025-04-23 23:03:25.298	2025-06-04 01:53:31.47	\N	\N	\N	\N	{"pendingDowngrade": {"date": "2025-05-20T19:53:00.919Z", "newPlanId": 4, "newPlanName": "Starter", "effectiveDate": "2025-05-23T23:03:25.298Z", "previousPlanId": 5, "previousPlanName": "Pro", "downgradingToPrice": 899, "isFreemiumDowngrade": false, "downgradingFromPrice": 1799}}
20	18	4	2025-05-14 21:41:23.593	2025-06-14 21:41:23.593	f	RAZORPAY	sub_QUxcCis3igdqUA	CANCELLED	f	\N	f	\N	\N	\N	2025-05-14 17:41:23.59466	2025-06-04 07:11:43.591	\N	\N	\N	\N	{}
38	18	6	2025-06-04 07:18:39.106	2025-07-04 07:18:39.106	t	RAZORPAY	sub_Qd28V6yKa0u4bS	ACTIVE	f	\N	f	\N	\N	\N	2025-06-04 07:18:39.107194	2025-06-04 07:18:39.107194	\N	\N	\N	\N	{"initialActivation": {"date": "2025-06-04T07:18:39.106Z", "planId": 6, "planName": "Elite", "paymentId": "pay_Qd29g3DY4lF6Fq"}}
\.


--
-- Data for Name: user_two_factor; Type: TABLE DATA; Schema: public; Owner: raja
--

COPY public.user_two_factor (id, user_id, enabled, preferred_method, created_at, updated_at) FROM stdin;
1	1	t	AUTHENTICATOR_APP	2025-05-23 18:11:11.473056	2025-05-25 02:06:29.575
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: raja
--

COPY public.users (id, username, email, password, full_name, is_admin, created_at, updated_at, last_login, razorpay_customer_id, last_password_change, password_history, failed_login_attempts, lockout_until, reset_password_token, reset_password_expiry, email_verified, email_verification_token, email_verification_expiry) FROM stdin;
23	anitha	anitha@futureaiit.com	d974d84700ef795c968f52450ce8b0cf8bd1b48fca5b5abb8317dd3ff0fae14d81ddc925e9d655e9f367c6a3d14574f8118edf36b46a53961b03b03b62640896.278f3f9ddb09dacfdd19b830fe9038d3	anitha	f	2025-05-16 02:40:07.545587	2025-05-16 06:40:07.544	\N	\N	2025-05-16 06:40:07.544	[{"password": "d974d84700ef795c968f52450ce8b0cf8bd1b48fca5b5abb8317dd3ff0fae14d81ddc925e9d655e9f367c6a3d14574f8118edf36b46a53961b03b03b62640896.278f3f9ddb09dacfdd19b830fe9038d3", "changedAt": "2025-05-16T06:40:07.544Z"}]	0	\N	\N	\N	f	\N	\N
24	baroor1	ritheshreddy26@gmail.com	bf82c6323e4f4f211c32cd31230c5bf50619d40537be94e2267780fe6c9b3cc0456b4f6dd3c906617ed57c891ba7a792994399fe8d8b49cdfb92ecd8d099d5d1.5ea9abec495249bc2f669b74dad37d55	Rithesh Reddy 	f	2025-05-17 19:11:52.026982	2025-05-17 23:15:00.689	2025-05-17 23:15:00.689	\N	2025-05-17 23:12:27.112	\N	0	\N	\N	\N	f	\N	\N
22	futureaiit	company@futureaiit.com	1a92a235edf54d0c84bfc5ddc38319cd4d0d00deaaaae0414cae55544b500575d3157e8ed4a70617b440661132c016153047469e74c3a132f89583c5d0a04a97.938d9b42f8115aecbead8dcea3b8ca02	Raja Muppidi	t	2025-05-15 19:56:47.519881	2025-05-16 01:05:11.747	2025-05-16 01:05:11.747	\N	2025-05-16 00:58:10.259	[{"password": "1a92a235edf54d0c84bfc5ddc38319cd4d0d00deaaaae0414cae55544b500575d3157e8ed4a70617b440661132c016153047469e74c3a132f89583c5d0a04a97.938d9b42f8115aecbead8dcea3b8ca02", "changedAt": "2025-05-16T00:58:10.259Z"}, {"password": "dfec2cca891e6d598eb0938c45b090aef10b6164eba6e462dc682a537896fd1f9941535c99a3ec86623308cfbe5ee8678a083ca9e6c564f4ac438b0dc0b840d2.6b30af55acc6599400323ed6bb9c855b", "changedAt": "2025-05-16T00:56:23.021Z"}, {"password": "bcb969b58a2115f4012226a45d699013f874c8c06865dab67a02acdf1031a6ac508336397eea8a39bd481917ecf80422658b64156a8cfdd314cdadcf48d08381.e3c275e29b9380a0722f6381e64d5b50", "changedAt": "2025-05-15T23:56:47.519Z"}]	0	\N	\N	\N	f	\N	\N
13	guyhembroff	hembroff@mtu.edu	bc5ab124d448e84bd2dbd67692875b06d1e93478e0c5167e4c36f57b60ad63fac1819fecbd760f7da6380bcb779bc5c71259a63a08907bb4266da0672fad5ab4.8f6cf07dee8db3be874b12593006c028	Guy Hembroff	f	2025-05-07 17:37:08.025219	2025-05-17 18:25:05.588	2025-05-17 18:25:05.588	\N	2025-05-16 01:37:47.038	[{"password": "c82b58875d762e59499d4e60427d0e705823e2f7aa8e5fef08ec0606e4cf85bde9dc9b3e0dff3482acca20d762bcd34068fbae9f23310ced92a2efbb4159ac05.94894d5139b1fbd4da29bbb1aac6f781", "changedAt": "2025-05-15T20:40:49.437Z"}]	0	\N	\N	\N	f	\N	\N
20	sukumar	sukumar@demo.com	c82b58875d762e59499d4e60427d0e705823e2f7aa8e5fef08ec0606e4cf85bde9dc9b3e0dff3482acca20d762bcd34068fbae9f23310ced92a2efbb4159ac05.94894d5139b1fbd4da29bbb1aac6f781	sukumar	f	2025-05-14 21:09:21.601639	2025-05-15 01:28:54.997	2025-05-15 01:28:35.767	cust_QV1KsL3HiIdRRA	2025-05-15 20:40:49.438891	[{"password": "c82b58875d762e59499d4e60427d0e705823e2f7aa8e5fef08ec0606e4cf85bde9dc9b3e0dff3482acca20d762bcd34068fbae9f23310ced92a2efbb4159ac05.94894d5139b1fbd4da29bbb1aac6f781", "changedAt": "2025-05-15T20:40:49.438Z"}]	0	\N	\N	\N	f	\N	\N
21	bhuvana	bhuvanamurki@mtu.edu	c82b58875d762e59499d4e60427d0e705823e2f7aa8e5fef08ec0606e4cf85bde9dc9b3e0dff3482acca20d762bcd34068fbae9f23310ced92a2efbb4159ac05.94894d5139b1fbd4da29bbb1aac6f781	bhuvana murki	f	2025-05-15 13:50:20.963531	2025-05-15 17:51:39.8	\N	cust_QVIG58VF7579YT	2025-05-15 20:40:49.43954	[{"password": "c82b58875d762e59499d4e60427d0e705823e2f7aa8e5fef08ec0606e4cf85bde9dc9b3e0dff3482acca20d762bcd34068fbae9f23310ced92a2efbb4159ac05.94894d5139b1fbd4da29bbb1aac6f781", "changedAt": "2025-05-15T20:40:49.439Z"}]	0	\N	\N	\N	f	\N	\N
19	peter	peter@futureaiit.com	c82b58875d762e59499d4e60427d0e705823e2f7aa8e5fef08ec0606e4cf85bde9dc9b3e0dff3482acca20d762bcd34068fbae9f23310ced92a2efbb4159ac05.94894d5139b1fbd4da29bbb1aac6f781	peter	f	2025-05-14 18:43:19.130134	2025-05-15 00:04:51.156	2025-05-15 00:04:28.35	cust_QUyi3JrL0GfnX8	2025-05-15 20:40:49.436055	[{"password": "c82b58875d762e59499d4e60427d0e705823e2f7aa8e5fef08ec0606e4cf85bde9dc9b3e0dff3482acca20d762bcd34068fbae9f23310ced92a2efbb4159ac05.94894d5139b1fbd4da29bbb1aac6f781", "changedAt": "2025-05-15T20:40:49.436Z"}]	0	\N	\N	\N	f	\N	\N
28	rjcreations	rjcreations2016@gmail.com	58a6beba719b201c01a78275be532a12f5f193c73725268b0947a8f74104ec1027cef8da49a7ec84e8a4cb5d7e424091444bc32a311eb30bfc04b2c686642f12.e497e25ed3e2eb95df6b721cd01a713e	rjcreations	f	2025-05-19 03:36:51.034464	2025-05-20 22:18:22.318	2025-05-20 22:18:04.054	cust_QWi9fRR6ZgX0zw	2025-05-19 07:36:51.033	[{"password": "58a6beba719b201c01a78275be532a12f5f193c73725268b0947a8f74104ec1027cef8da49a7ec84e8a4cb5d7e424091444bc32a311eb30bfc04b2c686642f12.e497e25ed3e2eb95df6b721cd01a713e", "changedAt": "2025-05-19T07:36:51.033Z"}]	0	\N	\N	\N	f	\N	\N
30	grokai	baxew53922@daxiake.com	767c54000e40124338eee886affe748b36f6dbc2511ec54cafc2661fbed48a6c115b2f54ff42cbbf0b9147e948e996fa90d6083115fd93a4257c7b2a37895eb8.6f35ea1ce9545ec86cb0fadf0c0638d2	Grok Ai	f	2025-05-23 02:09:57.251599	2025-05-23 06:17:48.662	\N	\N	2025-05-23 06:09:57.25	[{"password": "767c54000e40124338eee886affe748b36f6dbc2511ec54cafc2661fbed48a6c115b2f54ff42cbbf0b9147e948e996fa90d6083115fd93a4257c7b2a37895eb8.6f35ea1ce9545ec86cb0fadf0c0638d2", "changedAt": "2025-05-23T06:09:57.250Z"}]	0	\N	\N	\N	t	\N	\N
29	sandeepmuppidi	futureaiitconsulting@gmail.com	bc7ce420abb853bf24cee727cbe8a9f531c4ef70a49618b48fc53335558cbbfd64d351c3d0c6a20e3416b5ed64cdfe07f4e2fe08a3ceee5b3e1fc609d1281395.f9ccaa8f3a43bb9831d8abab1d22a037	sandeepmuppidi	f	2025-05-19 18:59:25.286051	2025-05-31 23:55:58.895	2025-05-29 04:23:35.385	cust_QWyfVcEdvZxZik	2025-05-29 04:23:30.311	[{"password": "43dc261f444dc35b6c7d451dd46a14813979ddb224a769f60373313c90bd6e3d7f9c4479c1a36cfcb50bf366f84c20760cbda813a201f639acfb992f817a0a97.750ef0f00bfe3bc5410ab9d982e1bbc6", "changedAt": "2025-05-21T08:52:28.367Z"}, {"password": "5c513e2e7825b8e6b5a46128f3cbb0c0ec557187dda5a8806ec7a258ef24c1ad04534e93aae133bcfc999cabd2a70c7e86f6a2d2ee86be611fc6739553bd8596.bb976f8c7aba45d31aeb903f45cee532", "changedAt": "2025-05-21T08:40:34.639Z"}, {"password": "3f44dbf3438a29f003dfac3f4d7a01533dd380c92b156bde125fac5fb31abdabb38b6ea4e6a88f487cd63f00150a057286f46e062c250c5e8e91875ab3cbe2a3.560c336841c07c3482089ed924cd0d6c", "changedAt": "2025-05-21T08:34:27.358Z"}]	0	\N	7fb1c6bf29f9075bcb4f78bd6e3a12687a8e353822b0bfe92d1acec42168590d	2025-05-30 04:23:35.385	t	\N	\N
31	lahari	lahari1799@gmail.com	2b4ec211008ff34a983bdf8f944a2434ef950592fbea2967a02b4cfc70928b79031c20f918532c0998ccfee191aecc1ed9faab3b99aed8d2aef63c08dd26582c.0cc63d81b384e8354141f697033fe09d	Lahari Sandepudi	f	2025-05-23 04:38:26.706889	2025-05-23 08:38:26.706	\N	\N	2025-05-23 08:38:26.706	[{"password": "2b4ec211008ff34a983bdf8f944a2434ef950592fbea2967a02b4cfc70928b79031c20f918532c0998ccfee191aecc1ed9faab3b99aed8d2aef63c08dd26582c.0cc63d81b384e8354141f697033fe09d", "changedAt": "2025-05-23T08:38:26.706Z"}]	0	\N	\N	\N	t	a4ec781fca232a87f31104a2b73d6a5c6f5941bdc33db2a75bf920d26f13b79a	2025-05-24 08:38:26.706
32	ksanskrutee@gmail.com	ksanskrutee@gmail.com	fed965723dd5b9a85a0cdfa2e030988cafa02ede47eccce3031e4748753815e051d0b30f00c104aede173c19874479068211aa4d55b4b736e4c4b0e88bcd573f.b03295e169f9df57cfa6336434517dbe	Sanskruti Kavatkar	f	2025-05-29 16:41:52.10651	2025-05-29 20:42:56.466	\N	\N	2025-05-29 20:41:52.105	[{"password": "fed965723dd5b9a85a0cdfa2e030988cafa02ede47eccce3031e4748753815e051d0b30f00c104aede173c19874479068211aa4d55b4b736e4c4b0e88bcd573f.b03295e169f9df57cfa6336434517dbe", "changedAt": "2025-05-29T20:41:52.105Z"}]	0	\N	\N	\N	t	\N	\N
18	sandeep	sandeep@muppidi.com	403f4fee211ab808da9d8f9cec3d8dec0852dffd633f156ef300cf791783a06afbf2b5ad555b16544ac1c9949dcd6be378fa806e9f4cda5518d13b84aef3d8d4.924a45d51f365355cbc5dd826ed904e1	sandeep	f	2025-05-14 17:38:52.468439	2025-06-04 07:17:21.849	2025-06-04 07:14:44.893	cust_QUxcBHSkwrv8mD	2025-06-04 07:14:39.318	[{"password": "c82b58875d762e59499d4e60427d0e705823e2f7aa8e5fef08ec0606e4cf85bde9dc9b3e0dff3482acca20d762bcd34068fbae9f23310ced92a2efbb4159ac05.94894d5139b1fbd4da29bbb1aac6f781", "changedAt": "2025-05-15T20:40:49.438Z"}]	0	\N	e7341acc5868aa00f7192963c96c53b7e2ca757f15f714aff9b556e72a181370	2025-06-05 07:14:44.893	t	\N	\N
1	rajamuppidi	rajamuppidi@futureaiit.com	5e841c29ef7293696ed9533116073082ee5172f9b7f942da13ce180495bf858fca595933f3733c411088567b2c390fb028e1528f89ef928a113b1e3030491d89.dce763a33ab93b599d2c3ed200e7a520	Raja Muppidi	t	2025-04-12 19:27:19.48241	2025-06-04 08:31:59.956	2025-06-04 08:31:59.955	cust_QWzkEcxm48fT4s	2025-05-16 01:05:40.564	[{"password": "c82b58875d762e59499d4e60427d0e705823e2f7aa8e5fef08ec0606e4cf85bde9dc9b3e0dff3482acca20d762bcd34068fbae9f23310ced92a2efbb4159ac05.94894d5139b1fbd4da29bbb1aac6f781", "changedAt": "2025-05-15T20:40:49.440Z"}]	0	\N	b06f340be5e409fae3302b703897ce9f6863e0e6c581a65529182f31dcc0962f	2025-06-05 08:31:59.955	t	\N	\N
\.


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE SET; Schema: drizzle; Owner: raja
--

SELECT pg_catalog.setval('drizzle.__drizzle_migrations_id_seq', 1, false);


--
-- Name: api_keys_id_seq; Type: SEQUENCE SET; Schema: public; Owner: raja
--

SELECT pg_catalog.setval('public.api_keys_id_seq', 1, true);


--
-- Name: app_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: raja
--

SELECT pg_catalog.setval('public.app_settings_id_seq', 154, true);


--
-- Name: blog_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: raja
--

SELECT pg_catalog.setval('public.blog_categories_id_seq', 6, true);


--
-- Name: blog_comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: raja
--

SELECT pg_catalog.setval('public.blog_comments_id_seq', 1, false);


--
-- Name: blog_media_id_seq; Type: SEQUENCE SET; Schema: public; Owner: raja
--

SELECT pg_catalog.setval('public.blog_media_id_seq', 9, true);


--
-- Name: blog_post_tags_id_seq; Type: SEQUENCE SET; Schema: public; Owner: raja
--

SELECT pg_catalog.setval('public.blog_post_tags_id_seq', 30, true);


--
-- Name: blog_posts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: raja
--

SELECT pg_catalog.setval('public.blog_posts_id_seq', 6, true);


--
-- Name: blog_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: raja
--

SELECT pg_catalog.setval('public.blog_settings_id_seq', 1, true);


--
-- Name: blog_tags_id_seq; Type: SEQUENCE SET; Schema: public; Owner: raja
--

SELECT pg_catalog.setval('public.blog_tags_id_seq', 11, true);


--
-- Name: branding_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: raja
--

SELECT pg_catalog.setval('public.branding_settings_id_seq', 1, true);


--
-- Name: company_tax_info_id_seq; Type: SEQUENCE SET; Schema: public; Owner: raja
--

SELECT pg_catalog.setval('public.company_tax_info_id_seq', 1, true);


--
-- Name: cover_letter_templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: raja
--

SELECT pg_catalog.setval('public.cover_letter_templates_id_seq', 3, true);


--
-- Name: cover_letters_id_seq; Type: SEQUENCE SET; Schema: public; Owner: raja
--

SELECT pg_catalog.setval('public.cover_letters_id_seq', 10, true);


--
-- Name: disputes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: raja
--

SELECT pg_catalog.setval('public.disputes_id_seq', 1, false);


--
-- Name: document_versions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: raja
--

SELECT pg_catalog.setval('public.document_versions_id_seq', 1, false);


--
-- Name: email_templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: raja
--

SELECT pg_catalog.setval('public.email_templates_id_seq', 6, true);


--
-- Name: feature_usage_id_seq; Type: SEQUENCE SET; Schema: public; Owner: raja
--

SELECT pg_catalog.setval('public.feature_usage_id_seq', 37, true);


--
-- Name: features_id_seq; Type: SEQUENCE SET; Schema: public; Owner: raja
--

SELECT pg_catalog.setval('public.features_id_seq', 18, true);


--
-- Name: invoice_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: raja
--

SELECT pg_catalog.setval('public.invoice_settings_id_seq', 1, true);


--
-- Name: invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: raja
--

SELECT pg_catalog.setval('public.invoices_id_seq', 7, true);


--
-- Name: job_applications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: raja
--

SELECT pg_catalog.setval('public.job_applications_id_seq', 5, true);


--
-- Name: job_descriptions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: raja
--

SELECT pg_catalog.setval('public.job_descriptions_id_seq', 1, false);


--
-- Name: notification_preferences_id_seq; Type: SEQUENCE SET; Schema: public; Owner: raja
--

SELECT pg_catalog.setval('public.notification_preferences_id_seq', 4, true);


--
-- Name: notification_templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: raja
--

SELECT pg_catalog.setval('public.notification_templates_id_seq', 9, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: raja
--

SELECT pg_catalog.setval('public.notifications_id_seq', 210, true);


--
-- Name: payment_gateway_configs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: raja
--

SELECT pg_catalog.setval('public.payment_gateway_configs_id_seq', 6, true);


--
-- Name: payment_methods_id_seq; Type: SEQUENCE SET; Schema: public; Owner: raja
--

SELECT pg_catalog.setval('public.payment_methods_id_seq', 1, false);


--
-- Name: payment_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: raja
--

SELECT pg_catalog.setval('public.payment_transactions_id_seq', 36, true);


--
-- Name: payment_webhook_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: raja
--

SELECT pg_catalog.setval('public.payment_webhook_events_id_seq', 1, false);


--
-- Name: plan_features_id_seq; Type: SEQUENCE SET; Schema: public; Owner: raja
--

SELECT pg_catalog.setval('public.plan_features_id_seq', 52, true);


--
-- Name: plan_pricing_id_seq; Type: SEQUENCE SET; Schema: public; Owner: raja
--

SELECT pg_catalog.setval('public.plan_pricing_id_seq', 17, true);


--
-- Name: resume_templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: raja
--

SELECT pg_catalog.setval('public.resume_templates_id_seq', 6, true);


--
-- Name: resumes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: raja
--

SELECT pg_catalog.setval('public.resumes_id_seq', 15, true);


--
-- Name: smtp_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: raja
--

SELECT pg_catalog.setval('public.smtp_settings_id_seq', 1, true);


--
-- Name: subscription_plans_id_seq; Type: SEQUENCE SET; Schema: public; Owner: raja
--

SELECT pg_catalog.setval('public.subscription_plans_id_seq', 9, true);


--
-- Name: tax_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: raja
--

SELECT pg_catalog.setval('public.tax_settings_id_seq', 11, true);


--
-- Name: two_factor_authenticator_id_seq; Type: SEQUENCE SET; Schema: public; Owner: raja
--

SELECT pg_catalog.setval('public.two_factor_authenticator_id_seq', 1, true);


--
-- Name: two_factor_backup_codes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: raja
--

SELECT pg_catalog.setval('public.two_factor_backup_codes_id_seq', 20, true);


--
-- Name: two_factor_email_id_seq; Type: SEQUENCE SET; Schema: public; Owner: raja
--

SELECT pg_catalog.setval('public.two_factor_email_id_seq', 1, true);


--
-- Name: two_factor_policy_id_seq; Type: SEQUENCE SET; Schema: public; Owner: raja
--

SELECT pg_catalog.setval('public.two_factor_policy_id_seq', 1, true);


--
-- Name: two_factor_remembered_devices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: raja
--

SELECT pg_catalog.setval('public.two_factor_remembered_devices_id_seq', 3, true);


--
-- Name: user_billing_details_id_seq; Type: SEQUENCE SET; Schema: public; Owner: raja
--

SELECT pg_catalog.setval('public.user_billing_details_id_seq', 18, true);


--
-- Name: user_subscriptions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: raja
--

SELECT pg_catalog.setval('public.user_subscriptions_id_seq', 38, true);


--
-- Name: user_two_factor_id_seq; Type: SEQUENCE SET; Schema: public; Owner: raja
--

SELECT pg_catalog.setval('public.user_two_factor_id_seq', 1, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: raja
--

SELECT pg_catalog.setval('public.users_id_seq', 32, true);


--
-- Name: __drizzle_migrations __drizzle_migrations_pkey; Type: CONSTRAINT; Schema: drizzle; Owner: raja
--

ALTER TABLE ONLY drizzle.__drizzle_migrations
    ADD CONSTRAINT __drizzle_migrations_pkey PRIMARY KEY (id);


--
-- Name: api_keys api_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_pkey PRIMARY KEY (id);


--
-- Name: app_settings app_settings_key_unique; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.app_settings
    ADD CONSTRAINT app_settings_key_unique UNIQUE (key);


--
-- Name: app_settings app_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.app_settings
    ADD CONSTRAINT app_settings_pkey PRIMARY KEY (id);


--
-- Name: blog_categories blog_categories_name_key; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.blog_categories
    ADD CONSTRAINT blog_categories_name_key UNIQUE (name);


--
-- Name: blog_categories blog_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.blog_categories
    ADD CONSTRAINT blog_categories_pkey PRIMARY KEY (id);


--
-- Name: blog_categories blog_categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.blog_categories
    ADD CONSTRAINT blog_categories_slug_key UNIQUE (slug);


--
-- Name: blog_comments blog_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.blog_comments
    ADD CONSTRAINT blog_comments_pkey PRIMARY KEY (id);


--
-- Name: blog_media blog_media_pkey; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.blog_media
    ADD CONSTRAINT blog_media_pkey PRIMARY KEY (id);


--
-- Name: blog_post_tags blog_post_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.blog_post_tags
    ADD CONSTRAINT blog_post_tags_pkey PRIMARY KEY (id);


--
-- Name: blog_post_tags blog_post_tags_post_id_tag_id_key; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.blog_post_tags
    ADD CONSTRAINT blog_post_tags_post_id_tag_id_key UNIQUE (post_id, tag_id);


--
-- Name: blog_posts blog_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_pkey PRIMARY KEY (id);


--
-- Name: blog_posts blog_posts_slug_key; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_slug_key UNIQUE (slug);


--
-- Name: blog_settings blog_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.blog_settings
    ADD CONSTRAINT blog_settings_pkey PRIMARY KEY (id);


--
-- Name: blog_tags blog_tags_name_key; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.blog_tags
    ADD CONSTRAINT blog_tags_name_key UNIQUE (name);


--
-- Name: blog_tags blog_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.blog_tags
    ADD CONSTRAINT blog_tags_pkey PRIMARY KEY (id);


--
-- Name: blog_tags blog_tags_slug_key; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.blog_tags
    ADD CONSTRAINT blog_tags_slug_key UNIQUE (slug);


--
-- Name: branding_settings branding_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.branding_settings
    ADD CONSTRAINT branding_settings_pkey PRIMARY KEY (id);


--
-- Name: company_tax_info company_tax_info_pkey; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.company_tax_info
    ADD CONSTRAINT company_tax_info_pkey PRIMARY KEY (id);


--
-- Name: cover_letter_templates cover_letter_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.cover_letter_templates
    ADD CONSTRAINT cover_letter_templates_pkey PRIMARY KEY (id);


--
-- Name: cover_letters cover_letters_pkey; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.cover_letters
    ADD CONSTRAINT cover_letters_pkey PRIMARY KEY (id);


--
-- Name: disputes disputes_pkey; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.disputes
    ADD CONSTRAINT disputes_pkey PRIMARY KEY (id);


--
-- Name: document_versions document_versions_document_id_document_type_version_number_key; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.document_versions
    ADD CONSTRAINT document_versions_document_id_document_type_version_number_key UNIQUE (document_id, document_type, version_number);


--
-- Name: document_versions document_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.document_versions
    ADD CONSTRAINT document_versions_pkey PRIMARY KEY (id);


--
-- Name: email_templates email_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT email_templates_pkey PRIMARY KEY (id);


--
-- Name: feature_usage feature_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.feature_usage
    ADD CONSTRAINT feature_usage_pkey PRIMARY KEY (id);


--
-- Name: feature_usage feature_usage_user_id_feature_id_key; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.feature_usage
    ADD CONSTRAINT feature_usage_user_id_feature_id_key UNIQUE (user_id, feature_id);


--
-- Name: features features_code_key; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.features
    ADD CONSTRAINT features_code_key UNIQUE (code);


--
-- Name: features features_pkey; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.features
    ADD CONSTRAINT features_pkey PRIMARY KEY (id);


--
-- Name: invoice_settings invoice_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.invoice_settings
    ADD CONSTRAINT invoice_settings_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_invoice_number_key; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_invoice_number_key UNIQUE (invoice_number);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: job_applications job_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.job_applications
    ADD CONSTRAINT job_applications_pkey PRIMARY KEY (id);


--
-- Name: job_descriptions job_descriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.job_descriptions
    ADD CONSTRAINT job_descriptions_pkey PRIMARY KEY (id);


--
-- Name: notification_preferences notification_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_pkey PRIMARY KEY (id);


--
-- Name: notification_preferences notification_preferences_user_id_key; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_user_id_key UNIQUE (user_id);


--
-- Name: notification_templates notification_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.notification_templates
    ADD CONSTRAINT notification_templates_pkey PRIMARY KEY (id);


--
-- Name: notification_templates notification_templates_type_key; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.notification_templates
    ADD CONSTRAINT notification_templates_type_key UNIQUE (type);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: payment_gateway_configs payment_gateway_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.payment_gateway_configs
    ADD CONSTRAINT payment_gateway_configs_pkey PRIMARY KEY (id);


--
-- Name: payment_methods payment_methods_pkey; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT payment_methods_pkey PRIMARY KEY (id);


--
-- Name: payment_transactions payment_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_pkey PRIMARY KEY (id);


--
-- Name: payment_webhook_events payment_webhook_events_pkey; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.payment_webhook_events
    ADD CONSTRAINT payment_webhook_events_pkey PRIMARY KEY (id);


--
-- Name: plan_features plan_features_pkey; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.plan_features
    ADD CONSTRAINT plan_features_pkey PRIMARY KEY (id);


--
-- Name: plan_features plan_features_plan_id_feature_id_key; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.plan_features
    ADD CONSTRAINT plan_features_plan_id_feature_id_key UNIQUE (plan_id, feature_id);


--
-- Name: plan_pricing plan_pricing_pkey; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.plan_pricing
    ADD CONSTRAINT plan_pricing_pkey PRIMARY KEY (id);


--
-- Name: plan_pricing plan_pricing_plan_id_target_region_key; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.plan_pricing
    ADD CONSTRAINT plan_pricing_plan_id_target_region_key UNIQUE (plan_id, target_region);


--
-- Name: resume_templates resume_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.resume_templates
    ADD CONSTRAINT resume_templates_pkey PRIMARY KEY (id);


--
-- Name: resumes resumes_pkey; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.resumes
    ADD CONSTRAINT resumes_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: smtp_settings smtp_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.smtp_settings
    ADD CONSTRAINT smtp_settings_pkey PRIMARY KEY (id);


--
-- Name: subscription_plans subscription_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_pkey PRIMARY KEY (id);


--
-- Name: tax_settings tax_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.tax_settings
    ADD CONSTRAINT tax_settings_pkey PRIMARY KEY (id);


--
-- Name: two_factor_authenticator two_factor_authenticator_pkey; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.two_factor_authenticator
    ADD CONSTRAINT two_factor_authenticator_pkey PRIMARY KEY (id);


--
-- Name: two_factor_authenticator two_factor_authenticator_user_id_key; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.two_factor_authenticator
    ADD CONSTRAINT two_factor_authenticator_user_id_key UNIQUE (user_id);


--
-- Name: two_factor_backup_codes two_factor_backup_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.two_factor_backup_codes
    ADD CONSTRAINT two_factor_backup_codes_pkey PRIMARY KEY (id);


--
-- Name: two_factor_backup_codes two_factor_backup_codes_user_id_code_key; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.two_factor_backup_codes
    ADD CONSTRAINT two_factor_backup_codes_user_id_code_key UNIQUE (user_id, code);


--
-- Name: two_factor_email two_factor_email_pkey; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.two_factor_email
    ADD CONSTRAINT two_factor_email_pkey PRIMARY KEY (id);


--
-- Name: two_factor_email two_factor_email_user_id_key; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.two_factor_email
    ADD CONSTRAINT two_factor_email_user_id_key UNIQUE (user_id);


--
-- Name: two_factor_policy two_factor_policy_pkey; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.two_factor_policy
    ADD CONSTRAINT two_factor_policy_pkey PRIMARY KEY (id);


--
-- Name: two_factor_remembered_devices two_factor_remembered_devices_pkey; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.two_factor_remembered_devices
    ADD CONSTRAINT two_factor_remembered_devices_pkey PRIMARY KEY (id);


--
-- Name: two_factor_remembered_devices two_factor_remembered_devices_user_id_device_identifier_key; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.two_factor_remembered_devices
    ADD CONSTRAINT two_factor_remembered_devices_user_id_device_identifier_key UNIQUE (user_id, device_identifier);


--
-- Name: payment_gateway_configs unique_default_gateway_per_service; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.payment_gateway_configs
    ADD CONSTRAINT unique_default_gateway_per_service EXCLUDE USING btree (service WITH =) WHERE (((is_default = true) AND (is_active = true)));


--
-- Name: payment_methods unique_default_payment_method_per_user_gateway; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT unique_default_payment_method_per_user_gateway EXCLUDE USING btree (user_id WITH =, gateway WITH =) WHERE (((is_default = true) AND (deleted_at IS NULL)));


--
-- Name: user_billing_details user_billing_details_pkey; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.user_billing_details
    ADD CONSTRAINT user_billing_details_pkey PRIMARY KEY (id);


--
-- Name: user_billing_details user_billing_details_user_id_key; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.user_billing_details
    ADD CONSTRAINT user_billing_details_user_id_key UNIQUE (user_id);


--
-- Name: user_subscriptions user_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: user_two_factor user_two_factor_pkey; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.user_two_factor
    ADD CONSTRAINT user_two_factor_pkey PRIMARY KEY (id);


--
-- Name: user_two_factor user_two_factor_user_id_key; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.user_two_factor
    ADD CONSTRAINT user_two_factor_user_id_key UNIQUE (user_id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: raja
--

CREATE INDEX "IDX_session_expire" ON public.session USING btree (expire);


--
-- Name: idx_blog_categories_active; Type: INDEX; Schema: public; Owner: raja
--

CREATE INDEX idx_blog_categories_active ON public.blog_categories USING btree (is_active);


--
-- Name: idx_blog_comments_approved; Type: INDEX; Schema: public; Owner: raja
--

CREATE INDEX idx_blog_comments_approved ON public.blog_comments USING btree (is_approved);


--
-- Name: idx_blog_comments_post; Type: INDEX; Schema: public; Owner: raja
--

CREATE INDEX idx_blog_comments_post ON public.blog_comments USING btree (post_id);


--
-- Name: idx_blog_media_created_at; Type: INDEX; Schema: public; Owner: raja
--

CREATE INDEX idx_blog_media_created_at ON public.blog_media USING btree (created_at);


--
-- Name: idx_blog_media_is_used; Type: INDEX; Schema: public; Owner: raja
--

CREATE INDEX idx_blog_media_is_used ON public.blog_media USING btree (is_used);


--
-- Name: idx_blog_media_type; Type: INDEX; Schema: public; Owner: raja
--

CREATE INDEX idx_blog_media_type ON public.blog_media USING btree (type);


--
-- Name: idx_blog_media_uploaded_by; Type: INDEX; Schema: public; Owner: raja
--

CREATE INDEX idx_blog_media_uploaded_by ON public.blog_media USING btree (uploaded_by);


--
-- Name: idx_blog_posts_author; Type: INDEX; Schema: public; Owner: raja
--

CREATE INDEX idx_blog_posts_author ON public.blog_posts USING btree (author_id);


--
-- Name: idx_blog_posts_category; Type: INDEX; Schema: public; Owner: raja
--

CREATE INDEX idx_blog_posts_category ON public.blog_posts USING btree (category_id);


--
-- Name: idx_blog_posts_featured; Type: INDEX; Schema: public; Owner: raja
--

CREATE INDEX idx_blog_posts_featured ON public.blog_posts USING btree (is_featured);


--
-- Name: idx_blog_posts_published; Type: INDEX; Schema: public; Owner: raja
--

CREATE INDEX idx_blog_posts_published ON public.blog_posts USING btree (published_at);


--
-- Name: idx_blog_posts_status; Type: INDEX; Schema: public; Owner: raja
--

CREATE INDEX idx_blog_posts_status ON public.blog_posts USING btree (status);


--
-- Name: idx_default_email_template; Type: INDEX; Schema: public; Owner: raja
--

CREATE UNIQUE INDEX idx_default_email_template ON public.email_templates USING btree (template_type) WHERE (is_default = true);


--
-- Name: idx_notification_preferences_user_id; Type: INDEX; Schema: public; Owner: raja
--

CREATE INDEX idx_notification_preferences_user_id ON public.notification_preferences USING btree (user_id);


--
-- Name: idx_notifications_category; Type: INDEX; Schema: public; Owner: raja
--

CREATE INDEX idx_notifications_category ON public.notifications USING btree (category);


--
-- Name: idx_notifications_created_at; Type: INDEX; Schema: public; Owner: raja
--

CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (created_at);


--
-- Name: idx_notifications_is_read; Type: INDEX; Schema: public; Owner: raja
--

CREATE INDEX idx_notifications_is_read ON public.notifications USING btree (is_read);


--
-- Name: idx_notifications_recipient_id; Type: INDEX; Schema: public; Owner: raja
--

CREATE INDEX idx_notifications_recipient_id ON public.notifications USING btree (recipient_id);


--
-- Name: idx_notifications_type; Type: INDEX; Schema: public; Owner: raja
--

CREATE INDEX idx_notifications_type ON public.notifications USING btree (type);


--
-- Name: idx_payment_gateway_active; Type: INDEX; Schema: public; Owner: raja
--

CREATE INDEX idx_payment_gateway_active ON public.payment_gateway_configs USING btree (is_active);


--
-- Name: idx_payment_gateway_configs_paypal; Type: INDEX; Schema: public; Owner: raja
--

CREATE INDEX idx_payment_gateway_configs_paypal ON public.payment_gateway_configs USING btree (service) WHERE (service = 'PAYPAL'::public.payment_gateway);


--
-- Name: idx_payment_gateway_service; Type: INDEX; Schema: public; Owner: raja
--

CREATE INDEX idx_payment_gateway_service ON public.payment_gateway_configs USING btree (service);


--
-- Name: idx_payment_methods_default; Type: INDEX; Schema: public; Owner: raja
--

CREATE INDEX idx_payment_methods_default ON public.payment_methods USING btree (user_id, is_default) WHERE (is_default = true);


--
-- Name: idx_payment_methods_gateway; Type: INDEX; Schema: public; Owner: raja
--

CREATE INDEX idx_payment_methods_gateway ON public.payment_methods USING btree (gateway);


--
-- Name: idx_payment_methods_user_id; Type: INDEX; Schema: public; Owner: raja
--

CREATE INDEX idx_payment_methods_user_id ON public.payment_methods USING btree (user_id);


--
-- Name: idx_resumes_skill_categories; Type: INDEX; Schema: public; Owner: raja
--

CREATE INDEX idx_resumes_skill_categories ON public.resumes USING gin (skill_categories);


--
-- Name: idx_user_billing_details_user_id; Type: INDEX; Schema: public; Owner: raja
--

CREATE INDEX idx_user_billing_details_user_id ON public.user_billing_details USING btree (user_id);


--
-- Name: idx_webhook_events_event_id; Type: INDEX; Schema: public; Owner: raja
--

CREATE INDEX idx_webhook_events_event_id ON public.payment_webhook_events USING btree (event_id);


--
-- Name: idx_webhook_events_gateway; Type: INDEX; Schema: public; Owner: raja
--

CREATE INDEX idx_webhook_events_gateway ON public.payment_webhook_events USING btree (gateway);


--
-- Name: idx_webhook_events_processed; Type: INDEX; Schema: public; Owner: raja
--

CREATE INDEX idx_webhook_events_processed ON public.payment_webhook_events USING btree (processed);


--
-- Name: idx_webhook_events_unique; Type: INDEX; Schema: public; Owner: raja
--

CREATE UNIQUE INDEX idx_webhook_events_unique ON public.payment_webhook_events USING btree (gateway, event_id);


--
-- Name: blog_categories blog_categories_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.blog_categories
    ADD CONSTRAINT blog_categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.blog_categories(id);


--
-- Name: blog_comments blog_comments_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.blog_comments
    ADD CONSTRAINT blog_comments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.blog_comments(id);


--
-- Name: blog_comments blog_comments_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.blog_comments
    ADD CONSTRAINT blog_comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.blog_posts(id) ON DELETE CASCADE;


--
-- Name: blog_media blog_media_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.blog_media
    ADD CONSTRAINT blog_media_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- Name: blog_post_tags blog_post_tags_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.blog_post_tags
    ADD CONSTRAINT blog_post_tags_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.blog_posts(id) ON DELETE CASCADE;


--
-- Name: blog_post_tags blog_post_tags_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.blog_post_tags
    ADD CONSTRAINT blog_post_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.blog_tags(id) ON DELETE CASCADE;


--
-- Name: blog_posts blog_posts_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id);


--
-- Name: blog_posts blog_posts_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.blog_categories(id);


--
-- Name: cover_letters cover_letters_resume_id_resumes_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.cover_letters
    ADD CONSTRAINT cover_letters_resume_id_resumes_id_fk FOREIGN KEY (resume_id) REFERENCES public.resumes(id);


--
-- Name: cover_letters cover_letters_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.cover_letters
    ADD CONSTRAINT cover_letters_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: disputes disputes_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.disputes
    ADD CONSTRAINT disputes_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.payment_transactions(id);


--
-- Name: disputes disputes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.disputes
    ADD CONSTRAINT disputes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: document_versions document_versions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.document_versions
    ADD CONSTRAINT document_versions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: feature_usage feature_usage_feature_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.feature_usage
    ADD CONSTRAINT feature_usage_feature_id_fkey FOREIGN KEY (feature_id) REFERENCES public.features(id);


--
-- Name: feature_usage feature_usage_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.feature_usage
    ADD CONSTRAINT feature_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: invoices invoices_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.user_subscriptions(id);


--
-- Name: invoices invoices_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.payment_transactions(id);


--
-- Name: invoices invoices_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: job_applications job_applications_cover_letter_id_cover_letters_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.job_applications
    ADD CONSTRAINT job_applications_cover_letter_id_cover_letters_id_fk FOREIGN KEY (cover_letter_id) REFERENCES public.cover_letters(id);


--
-- Name: job_applications job_applications_resume_id_resumes_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.job_applications
    ADD CONSTRAINT job_applications_resume_id_resumes_id_fk FOREIGN KEY (resume_id) REFERENCES public.resumes(id);


--
-- Name: job_applications job_applications_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.job_applications
    ADD CONSTRAINT job_applications_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: job_descriptions job_descriptions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.job_descriptions
    ADD CONSTRAINT job_descriptions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: notification_preferences notification_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_recipient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: payment_methods payment_methods_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT payment_methods_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: payment_transactions payment_transactions_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.user_subscriptions(id);


--
-- Name: payment_transactions payment_transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: plan_features plan_features_feature_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.plan_features
    ADD CONSTRAINT plan_features_feature_id_fkey FOREIGN KEY (feature_id) REFERENCES public.features(id);


--
-- Name: plan_features plan_features_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.plan_features
    ADD CONSTRAINT plan_features_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id);


--
-- Name: plan_pricing plan_pricing_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.plan_pricing
    ADD CONSTRAINT plan_pricing_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id);


--
-- Name: resumes resumes_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.resumes
    ADD CONSTRAINT resumes_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: two_factor_authenticator two_factor_authenticator_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.two_factor_authenticator
    ADD CONSTRAINT two_factor_authenticator_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: two_factor_backup_codes two_factor_backup_codes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.two_factor_backup_codes
    ADD CONSTRAINT two_factor_backup_codes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: two_factor_email two_factor_email_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.two_factor_email
    ADD CONSTRAINT two_factor_email_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: two_factor_remembered_devices two_factor_remembered_devices_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.two_factor_remembered_devices
    ADD CONSTRAINT two_factor_remembered_devices_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_billing_details user_billing_details_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.user_billing_details
    ADD CONSTRAINT user_billing_details_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_subscriptions user_subscriptions_pending_plan_change_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_pending_plan_change_to_fkey FOREIGN KEY (pending_plan_change_to) REFERENCES public.subscription_plans(id);


--
-- Name: user_subscriptions user_subscriptions_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id);


--
-- Name: user_subscriptions user_subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_two_factor user_two_factor_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: raja
--

ALTER TABLE ONLY public.user_two_factor
    ADD CONSTRAINT user_two_factor_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

