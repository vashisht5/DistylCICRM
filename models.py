"""
Distyl Intel Portal - Database Models
17 tables: 15 intel tables + users + oauth_tokens
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Float, JSON, ForeignKey, Enum
from sqlalchemy.orm import relationship
import enum
from database import Base


class EntityType(str, enum.Enum):
    competitor = "competitor"
    target = "target"
    partner = "partner"

class ThreatLevel(str, enum.Enum):
    critical = "critical"
    high = "high"
    medium = "medium"
    low = "low"
    monitor = "monitor"

class UserRole(str, enum.Enum):
    admin = "admin"
    analyst = "analyst"
    sales = "sales"
    viewer = "viewer"


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, nullable=False)
    name = Column(String(255))
    google_id = Column(String(255), unique=True)
    slack_user_id = Column(String(100))
    picture_url = Column(String(500))
    role = Column(String(20), default="analyst")
    last_login = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "google_id": self.google_id,
            "slack_user_id": self.slack_user_id,
            "picture_url": self.picture_url,
            "role": self.role,
            "last_login": self.last_login.isoformat() if self.last_login else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class OAuthToken(Base):
    __tablename__ = "oauth_tokens"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    provider = Column(String(50), nullable=False)
    access_token = Column(Text)
    refresh_token = Column(Text)
    expires_at = Column(DateTime)
    scopes = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "provider": self.provider,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "scopes": self.scopes,
        }


class Entity(Base):
    __tablename__ = "entities"
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False, unique=True)
    entity_type = Column(String(20), nullable=False)
    website = Column(String(500))
    description = Column(Text)
    headquarters = Column(String(255))
    employee_count = Column(String(50))
    funding_stage = Column(String(100))
    industry = Column(String(100))
    primary_use_cases = Column(JSON)
    known_clients = Column(JSON)
    products = Column(JSON)
    distyl_exposure = Column(String(20), default="none")
    threat_level = Column(String(20), default="monitor")
    status = Column(String(20), default="active")
    last_enriched_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    dossiers = relationship("Dossier", back_populates="entity", lazy="dynamic")
    signals = relationship("Signal", back_populates="entity", lazy="dynamic")
    news_items = relationship("NewsItem", back_populates="entity", lazy="dynamic")
    people = relationship("Person", back_populates="entity", lazy="dynamic")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "entity_type": self.entity_type,
            "website": self.website,
            "description": self.description,
            "headquarters": self.headquarters,
            "employee_count": self.employee_count,
            "funding_stage": self.funding_stage,
            "industry": self.industry,
            "primary_use_cases": self.primary_use_cases,
            "known_clients": self.known_clients,
            "products": self.products,
            "distyl_exposure": self.distyl_exposure,
            "threat_level": self.threat_level,
            "status": self.status,
            "last_enriched_at": self.last_enriched_at.isoformat() if self.last_enriched_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class Dossier(Base):
    __tablename__ = "dossiers"
    id = Column(Integer, primary_key=True)
    entity_id = Column(Integer, ForeignKey("entities.id"), nullable=False)
    version = Column(Integer, default=1)
    section_a_synopsis = Column(Text)
    section_b_business_model = Column(Text)
    section_c_products = Column(Text)
    section_d_clients = Column(Text)
    section_e_gtm = Column(Text)
    section_f_exec_team = Column(Text)
    section_g_financials = Column(Text)
    section_h_technology = Column(Text)
    section_i_partnerships = Column(Text)
    section_j_competitive = Column(Text)
    section_k_threats = Column(Text)
    section_l_appendix = Column(JSON)
    ceo_brief = Column(JSON)
    overall_confidence = Column(String(10))
    source_count = Column(Integer, default=0)
    hallucination_flags = Column(JSON)
    verified_facts = Column(JSON)
    prompt_version = Column(String(50))
    eval_score = Column(Integer)
    generation_status = Column(String(20), default="pending")
    generated_at = Column(DateTime)
    generated_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    entity = relationship("Entity", back_populates="dossiers")

    def to_dict(self):
        return {
            "id": self.id,
            "entity_id": self.entity_id,
            "version": self.version,
            "section_a_synopsis": self.section_a_synopsis,
            "section_b_business_model": self.section_b_business_model,
            "section_c_products": self.section_c_products,
            "section_d_clients": self.section_d_clients,
            "section_e_gtm": self.section_e_gtm,
            "section_f_exec_team": self.section_f_exec_team,
            "section_g_financials": self.section_g_financials,
            "section_h_technology": self.section_h_technology,
            "section_i_partnerships": self.section_i_partnerships,
            "section_j_competitive": self.section_j_competitive,
            "section_k_threats": self.section_k_threats,
            "section_l_appendix": self.section_l_appendix,
            "ceo_brief": self.ceo_brief,
            "overall_confidence": self.overall_confidence,
            "source_count": self.source_count,
            "hallucination_flags": self.hallucination_flags,
            "verified_facts": self.verified_facts,
            "prompt_version": self.prompt_version,
            "eval_score": self.eval_score,
            "generation_status": self.generation_status,
            "generated_at": self.generated_at.isoformat() if self.generated_at else None,
            "generated_by": self.generated_by,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class DossierFact(Base):
    __tablename__ = "dossier_facts"
    id = Column(Integer, primary_key=True)
    dossier_id = Column(Integer, ForeignKey("dossiers.id"), nullable=False)
    entity_id = Column(Integer, ForeignKey("entities.id"), nullable=False)
    section = Column(String(5))
    claim = Column(Text)
    source_url = Column(String(1000))
    source_type = Column(String(20))
    source_date = Column(DateTime)
    confidence = Column(String(10))
    verified = Column(Boolean, default=False)
    verified_by = Column(Integer, ForeignKey("users.id"))
    is_hallucination = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "dossier_id": self.dossier_id,
            "entity_id": self.entity_id,
            "section": self.section,
            "claim": self.claim,
            "source_url": self.source_url,
            "source_type": self.source_type,
            "source_date": self.source_date.isoformat() if self.source_date else None,
            "confidence": self.confidence,
            "verified": self.verified,
            "verified_by": self.verified_by,
            "is_hallucination": self.is_hallucination,
        }


class Signal(Base):
    __tablename__ = "signals"
    id = Column(Integer, primary_key=True)
    entity_id = Column(Integer, ForeignKey("entities.id"), nullable=False)
    signal_type = Column(String(50))
    title = Column(String(500))
    summary = Column(Text)
    source_url = Column(String(1000))
    source_name = Column(String(255))
    source_type = Column(String(50))
    source_date = Column(DateTime)
    ingested_at = Column(DateTime, default=datetime.utcnow)
    score = Column(Integer, default=0)
    score_rationale = Column(Text)
    deal_relevance = Column(JSON)
    notified_slack = Column(Boolean, default=False)
    batch_id = Column(String(100))
    status = Column(String(20), default="new")
    created_at = Column(DateTime, default=datetime.utcnow)

    entity = relationship("Entity", back_populates="signals")

    def to_dict(self):
        return {
            "id": self.id,
            "entity_id": self.entity_id,
            "signal_type": self.signal_type,
            "title": self.title,
            "summary": self.summary,
            "source_url": self.source_url,
            "source_name": self.source_name,
            "source_type": self.source_type,
            "source_date": self.source_date.isoformat() if self.source_date else None,
            "ingested_at": self.ingested_at.isoformat() if self.ingested_at else None,
            "score": self.score,
            "score_rationale": self.score_rationale,
            "deal_relevance": self.deal_relevance,
            "notified_slack": self.notified_slack,
            "batch_id": self.batch_id,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class NewsItem(Base):
    __tablename__ = "news_items"
    id = Column(Integer, primary_key=True)
    entity_id = Column(Integer, ForeignKey("entities.id"), nullable=False)
    headline = Column(String(1000))
    summary = Column(Text)
    url = Column(String(1000), unique=True)
    source_name = Column(String(255))
    source_type = Column(String(50))
    published_at = Column(DateTime)
    fetched_at = Column(DateTime, default=datetime.utcnow)
    relevance_score = Column(Integer, default=0)
    promoted_to_signal = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    entity = relationship("Entity", back_populates="news_items")

    def to_dict(self):
        return {
            "id": self.id,
            "entity_id": self.entity_id,
            "headline": self.headline,
            "summary": self.summary,
            "url": self.url,
            "source_name": self.source_name,
            "source_type": self.source_type,
            "published_at": self.published_at.isoformat() if self.published_at else None,
            "fetched_at": self.fetched_at.isoformat() if self.fetched_at else None,
            "relevance_score": self.relevance_score,
            "promoted_to_signal": self.promoted_to_signal,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

class Person(Base):
    __tablename__ = "people"
    id = Column(Integer, primary_key=True)
    entity_id = Column(Integer, ForeignKey("entities.id"), nullable=False)
    first_name = Column(String(100))
    last_name = Column(String(100))
    title = Column(String(255))
    current_company = Column(String(255))
    previous_companies = Column(JSON)
    linkedin_url = Column(String(500))
    email = Column(String(255))
    person_type = Column(String(50))
    distyl_relationship = Column(String(20), default="unknown")
    last_known_move = Column(DateTime)
    notes = Column(Text)
    status = Column(String(20), default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    entity = relationship("Entity", back_populates="people")

    def to_dict(self):
        return {
            "id": self.id,
            "entity_id": self.entity_id,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "title": self.title,
            "current_company": self.current_company,
            "previous_companies": self.previous_companies,
            "linkedin_url": self.linkedin_url,
            "email": self.email,
            "person_type": self.person_type,
            "distyl_relationship": self.distyl_relationship,
            "last_known_move": self.last_known_move.isoformat() if self.last_known_move else None,
            "notes": self.notes,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class PersonMovement(Base):
    __tablename__ = "person_movements"
    id = Column(Integer, primary_key=True)
    person_id = Column(Integer, ForeignKey("people.id"), nullable=False)
    from_company = Column(String(255))
    from_title = Column(String(255))
    to_company = Column(String(255))
    to_title = Column(String(255))
    detected_at = Column(DateTime, default=datetime.utcnow)
    source_url = Column(String(1000))
    signal_id = Column(Integer, ForeignKey("signals.id"))

    def to_dict(self):
        return {
            "id": self.id,
            "person_id": self.person_id,
            "from_company": self.from_company,
            "from_title": self.from_title,
            "to_company": self.to_company,
            "to_title": self.to_title,
            "detected_at": self.detected_at.isoformat() if self.detected_at else None,
            "source_url": self.source_url,
            "signal_id": self.signal_id,
        }


class Deal(Base):
    __tablename__ = "deals"
    id = Column(Integer, primary_key=True)
    account_name = Column(String(255), nullable=False)
    deal_name = Column(String(500))
    stage = Column(String(50), default="prospecting")
    value_usd = Column(Integer)
    close_date = Column(DateTime)
    owner = Column(String(255))
    distyl_product = Column(String(50))
    win_loss_status = Column(String(20))
    loss_reason = Column(Text)
    loss_competitor_id = Column(Integer, ForeignKey("entities.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    competitors = relationship("DealCompetitor", back_populates="deal")

    def to_dict(self):
        return {
            "id": self.id,
            "account_name": self.account_name,
            "deal_name": self.deal_name,
            "stage": self.stage,
            "value_usd": self.value_usd,
            "close_date": self.close_date.isoformat() if self.close_date else None,
            "owner": self.owner,
            "distyl_product": self.distyl_product,
            "win_loss_status": self.win_loss_status,
            "loss_reason": self.loss_reason,
            "loss_competitor_id": self.loss_competitor_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class DealCompetitor(Base):
    __tablename__ = "deal_competitors"
    id = Column(Integer, primary_key=True)
    deal_id = Column(Integer, ForeignKey("deals.id"), nullable=False)
    entity_id = Column(Integer, ForeignKey("entities.id"), nullable=False)
    involvement = Column(String(30))
    source = Column(String(255))
    added_at = Column(DateTime, default=datetime.utcnow)

    deal = relationship("Deal", back_populates="competitors")

    def to_dict(self):
        return {
            "id": self.id,
            "deal_id": self.deal_id,
            "entity_id": self.entity_id,
            "involvement": self.involvement,
            "source": self.source,
            "added_at": self.added_at.isoformat() if self.added_at else None,
        }

class Partnership(Base):
    __tablename__ = "partnerships"
    id = Column(Integer, primary_key=True)
    entity_a_id = Column(Integer, ForeignKey("entities.id"), nullable=False)
    entity_b_id = Column(Integer, ForeignKey("entities.id"), nullable=False)
    partnership_type = Column(String(30))
    description = Column(Text)
    announced_date = Column(DateTime)
    source_url = Column(String(1000))
    strength = Column(String(20))
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "entity_a_id": self.entity_a_id,
            "entity_b_id": self.entity_b_id,
            "partnership_type": self.partnership_type,
            "description": self.description,
            "announced_date": self.announced_date.isoformat() if self.announced_date else None,
            "source_url": self.source_url,
            "strength": self.strength,
        }


class BattleCard(Base):
    __tablename__ = "battle_cards"
    id = Column(Integer, primary_key=True)
    entity_id = Column(Integer, ForeignKey("entities.id"), nullable=False)
    dossier_id = Column(Integer, ForeignKey("dossiers.id"))
    use_case = Column(String(255))
    distyl_product = Column(String(50))
    content = Column(JSON)
    version = Column(Integer, default=1)
    status = Column(String(20), default="draft")
    generated_at = Column(DateTime, default=datetime.utcnow)
    approved_by = Column(Integer, ForeignKey("users.id"))

    def to_dict(self):
        return {
            "id": self.id,
            "entity_id": self.entity_id,
            "dossier_id": self.dossier_id,
            "use_case": self.use_case,
            "distyl_product": self.distyl_product,
            "content": self.content,
            "version": self.version,
            "status": self.status,
            "generated_at": self.generated_at.isoformat() if self.generated_at else None,
            "approved_by": self.approved_by,
        }


class Digest(Base):
    __tablename__ = "digests"
    id = Column(Integer, primary_key=True)
    digest_type = Column(String(30))
    week_number = Column(Integer)
    year = Column(Integer)
    subject = Column(String(500))
    content = Column(JSON)
    slack_posted = Column(Boolean, default=False)
    slack_ts = Column(String(100))
    status = Column(String(20), default="draft")
    generated_at = Column(DateTime, default=datetime.utcnow)
    posted_at = Column(DateTime)

    def to_dict(self):
        return {
            "id": self.id,
            "digest_type": self.digest_type,
            "week_number": self.week_number,
            "year": self.year,
            "subject": self.subject,
            "content": self.content,
            "slack_posted": self.slack_posted,
            "slack_ts": self.slack_ts,
            "status": self.status,
            "generated_at": self.generated_at.isoformat() if self.generated_at else None,
            "posted_at": self.posted_at.isoformat() if self.posted_at else None,
        }


class GmailMention(Base):
    __tablename__ = "gmail_mentions"
    id = Column(Integer, primary_key=True)
    gmail_message_id = Column(String(255), unique=True, nullable=False)
    thread_id = Column(String(255))
    subject = Column(String(1000))
    sender = Column(String(500))
    received_at = Column(DateTime)
    entity_mentions = Column(JSON)
    signal_ids = Column(JSON)
    draft_assist = Column(Text)
    processed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "gmail_message_id": self.gmail_message_id,
            "thread_id": self.thread_id,
            "subject": self.subject,
            "sender": self.sender,
            "received_at": self.received_at.isoformat() if self.received_at else None,
            "entity_mentions": self.entity_mentions,
            "signal_ids": self.signal_ids,
            "draft_assist": self.draft_assist,
            "processed": self.processed,
        }


class DriveDoc(Base):
    __tablename__ = "drive_docs"
    id = Column(Integer, primary_key=True)
    google_file_id = Column(String(255), unique=True, nullable=False)
    title = Column(String(500))
    folder_id = Column(String(255))
    doc_type = Column(String(30))
    last_modified = Column(DateTime)
    last_synced = Column(DateTime)
    extracted_text = Column(Text)
    entity_mentions = Column(JSON)
    signal_ids = Column(JSON)
    processed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "google_file_id": self.google_file_id,
            "title": self.title,
            "folder_id": self.folder_id,
            "doc_type": self.doc_type,
            "last_modified": self.last_modified.isoformat() if self.last_modified else None,
            "last_synced": self.last_synced.isoformat() if self.last_synced else None,
            "entity_mentions": self.entity_mentions,
            "signal_ids": self.signal_ids,
            "processed": self.processed,
        }


class PushFeedback(Base):
    __tablename__ = "push_feedback"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    signal_id = Column(Integer, ForeignKey("signals.id"))
    push_type = Column(String(30))
    action = Column(String(20))
    actioned_at = Column(DateTime, default=datetime.utcnow)
    push_rationale = Column(Text)
    calibration_applied = Column(Boolean, default=False)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "signal_id": self.signal_id,
            "push_type": self.push_type,
            "action": self.action,
            "actioned_at": self.actioned_at.isoformat() if self.actioned_at else None,
            "push_rationale": self.push_rationale,
        }
