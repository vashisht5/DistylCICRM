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
    tech_stack = Column(JSON)
    icp_score = Column(Integer)
    icp_rationale = Column(Text)
    key_challenges = Column(JSON)
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
            "tech_stack": self.tech_stack,
            "icp_score": self.icp_score,
            "icp_rationale": self.icp_rationale,
            "key_challenges": self.key_challenges,
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


class MeetingNote(Base):
    __tablename__ = "meeting_notes"
    id = Column(Integer, primary_key=True)
    title = Column(String(500))
    raw_text = Column(Text, nullable=False)
    source = Column(String(30), default="manual")  # manual/slack/gmail
    meeting_date = Column(DateTime)
    entity_ids = Column(JSON)      # list of entity IDs referenced
    person_ids = Column(JSON)      # list of person IDs referenced
    deal_ids = Column(JSON)        # list of deal IDs referenced
    extracted_contacts = Column(JSON)      # [{name, title, company}, ...]
    extracted_action_items = Column(JSON)  # [str, ...]
    extracted_deal_data = Column(JSON)     # {stage, value, competitors, next_steps}
    extracted_signals = Column(JSON)       # [{title, summary, entity_name}, ...]
    processing_status = Column(String(20), default="pending")  # pending/processing/done/failed
    processed_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "raw_text": self.raw_text,
            "source": self.source,
            "meeting_date": self.meeting_date.isoformat() if self.meeting_date else None,
            "entity_ids": self.entity_ids,
            "person_ids": self.person_ids,
            "deal_ids": self.deal_ids,
            "extracted_contacts": self.extracted_contacts,
            "extracted_action_items": self.extracted_action_items,
            "extracted_deal_data": self.extracted_deal_data,
            "extracted_signals": self.extracted_signals,
            "processing_status": self.processing_status,
            "processed_at": self.processed_at.isoformat() if self.processed_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class StakeholderProfile(Base):
    __tablename__ = 'stakeholder_profiles'
    id = Column(Integer, primary_key=True)
    person_id = Column(Integer, ForeignKey('people.id'), nullable=True)
    created_by = Column(Integer, ForeignKey('users.id'))
    name = Column(String(255), nullable=False)
    title = Column(String(255))
    company = Column(String(255))
    role = Column(String(50))  # procurement|legal|champion|exec|finance|technical|board|user_buyer
    reports_to_id = Column(Integer, ForeignKey('stakeholder_profiles.id'), nullable=True)
    department = Column(String(255))
    budget_authority_usd = Column(Integer)
    owns_budget_for = Column(Text)
    team_size = Column(Integer)
    decision_style = Column(String(50))  # analytical|intuitive|consensus|directive|relational
    risk_tolerance = Column(String(50))  # risk_averse|moderate|risk_tolerant
    ego_level = Column(String(20))  # low|medium|high
    orientation = Column(String(30))  # transactional|relational
    communication_style = Column(String(30))  # direct|diplomatic|data_driven|political|emotional
    primary_motivation = Column(String(50))  # cost_reduction|risk_mitigation|career_advancement|innovation|compliance
    influence_level = Column(String(30))  # low|medium|high|key_decision_maker
    technical_depth = Column(String(30))  # non_technical|moderate|deep_technical
    typical_opening_position = Column(Text)
    hot_buttons = Column(JSON)
    known_tactics = Column(JSON)
    concession_pattern = Column(String(30))  # never_first|reciprocal|random|strategic_early
    typical_objectives = Column(JSON)
    typical_constraints = Column(JSON)
    raw_notes = Column(Text)
    attributes = Column(JSON)
    past_interactions = Column(Text)
    win_rate = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    reports_to = relationship('StakeholderProfile', remote_side='StakeholderProfile.id', foreign_keys=[reports_to_id], overlaps='direct_reports')
    direct_reports = relationship('StakeholderProfile', foreign_keys=[reports_to_id], overlaps='reports_to')

    def to_dict(self):
        return {
            'id': self.id, 'person_id': self.person_id, 'created_by': self.created_by,
            'name': self.name, 'title': self.title, 'company': self.company, 'role': self.role,
            'reports_to_id': self.reports_to_id, 'department': self.department,
            'budget_authority_usd': self.budget_authority_usd, 'owns_budget_for': self.owns_budget_for,
            'team_size': self.team_size, 'decision_style': self.decision_style,
            'risk_tolerance': self.risk_tolerance, 'ego_level': self.ego_level,
            'orientation': self.orientation, 'communication_style': self.communication_style,
            'primary_motivation': self.primary_motivation, 'influence_level': self.influence_level,
            'technical_depth': self.technical_depth, 'typical_opening_position': self.typical_opening_position,
            'hot_buttons': self.hot_buttons, 'known_tactics': self.known_tactics,
            'concession_pattern': self.concession_pattern, 'typical_objectives': self.typical_objectives,
            'typical_constraints': self.typical_constraints, 'raw_notes': self.raw_notes,
            'attributes': self.attributes, 'past_interactions': self.past_interactions,
            'win_rate': self.win_rate,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class DealIntel(Base):
    __tablename__ = 'deal_intel'
    id = Column(Integer, primary_key=True)
    deal_id = Column(Integer, ForeignKey('deals.id'), unique=True, nullable=False)
    presales_stage = Column(String(30), default='discovery')
    # discovery|qualification|technical_eval|pricing|negotiation|close
    metrics = Column(Text)
    economic_buyer_profile_id = Column(Integer, ForeignKey('stakeholder_profiles.id'), nullable=True)
    economic_buyer_notes = Column(Text)
    decision_criteria = Column(JSON)
    decision_process = Column(Text)
    identified_pain = Column(Text)
    champion_profile_id = Column(Integer, ForeignKey('stakeholder_profiles.id'), nullable=True)
    champion_notes = Column(Text)
    stakeholder_map = Column(JSON)
    seller_batna = Column(Text)
    buyer_batna_estimate = Column(Text)
    key_risks = Column(JSON)
    next_steps = Column(JSON)
    raw_notes = Column(Text)
    attributes = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    deal = relationship('Deal', foreign_keys=[deal_id])
    economic_buyer = relationship('StakeholderProfile', foreign_keys=[economic_buyer_profile_id])
    champion = relationship('StakeholderProfile', foreign_keys=[champion_profile_id])

    def to_dict(self):
        return {
            'id': self.id, 'deal_id': self.deal_id, 'presales_stage': self.presales_stage,
            'metrics': self.metrics, 'economic_buyer_profile_id': self.economic_buyer_profile_id,
            'economic_buyer_notes': self.economic_buyer_notes, 'decision_criteria': self.decision_criteria,
            'decision_process': self.decision_process, 'identified_pain': self.identified_pain,
            'champion_profile_id': self.champion_profile_id, 'champion_notes': self.champion_notes,
            'stakeholder_map': self.stakeholder_map, 'seller_batna': self.seller_batna,
            'buyer_batna_estimate': self.buyer_batna_estimate, 'key_risks': self.key_risks,
            'next_steps': self.next_steps, 'raw_notes': self.raw_notes, 'attributes': self.attributes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class Wargame(Base):
    __tablename__ = 'wargames'
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    deal_id = Column(Integer, ForeignKey('deals.id'), nullable=True)
    created_by = Column(Integer, ForeignKey('users.id'))
    presales_stage = Column(String(30), default='negotiation')
    status = Column(String(30), default='setup')
    # setup|active|processing_turn|auto_running|completed|archived
    scenario_type = Column(String(50), default='standard')
    # standard|competitive_displacement|budget_freeze|champion_lost|renewal|time_pressure
    deal_context = Column(JSON)
    current_round = Column(Integer, default=0)
    max_rounds = Column(Integer, default=10)
    outcome = Column(String(20))  # won|lost|stalled|walkaway
    outcome_summary = Column(Text)
    analysis = Column(JSON)
    monte_carlo_status = Column(String(20))
    monte_carlo_results = Column(JSON)
    simulation_paths = Column(JSON)       # full path narratives [{path_id, label, strategy, outcome, turns, summary, key_moments}]
    simulation_status = Column(String(20), default='idle')   # idle|running|complete|failed
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    participants = relationship('WargameParticipant', back_populates='wargame', lazy='dynamic')
    turns = relationship('WargameTurn', back_populates='wargame', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id, 'name': self.name, 'deal_id': self.deal_id, 'created_by': self.created_by,
            'presales_stage': self.presales_stage, 'status': self.status,
            'scenario_type': self.scenario_type, 'deal_context': self.deal_context,
            'current_round': self.current_round, 'max_rounds': self.max_rounds,
            'outcome': self.outcome, 'outcome_summary': self.outcome_summary,
            'analysis': self.analysis, 'monte_carlo_status': self.monte_carlo_status,
            'monte_carlo_results': self.monte_carlo_results,
            'simulation_paths': self.simulation_paths,
            'simulation_status': self.simulation_status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class WargameParticipant(Base):
    __tablename__ = 'wargame_participants'
    id = Column(Integer, primary_key=True)
    wargame_id = Column(Integer, ForeignKey('wargames.id'), nullable=False)
    profile_id = Column(Integer, ForeignKey('stakeholder_profiles.id'), nullable=True)
    team = Column(String(10))  # buyer|seller
    objectives_override = Column(JSON)
    constraints_override = Column(JSON)
    opening_notes = Column(Text)
    current_trust_score = Column(Integer, default=50)
    batna_signal = Column(String(50))
    engagement_level = Column(String(20))

    wargame = relationship('Wargame', back_populates='participants')
    profile = relationship('StakeholderProfile', foreign_keys=[profile_id])

    def to_dict(self):
        return {
            'id': self.id, 'wargame_id': self.wargame_id, 'profile_id': self.profile_id,
            'team': self.team, 'objectives_override': self.objectives_override,
            'constraints_override': self.constraints_override, 'opening_notes': self.opening_notes,
            'current_trust_score': self.current_trust_score, 'batna_signal': self.batna_signal,
            'engagement_level': self.engagement_level,
        }


class WargameTurn(Base):
    __tablename__ = 'wargame_turns'
    id = Column(Integer, primary_key=True)
    wargame_id = Column(Integer, ForeignKey('wargames.id'), nullable=False)
    round_number = Column(Integer)
    participant_id = Column(Integer, ForeignKey('wargame_participants.id'), nullable=True)
    actor_label = Column(String(100))
    action_type = Column(String(30))
    # offer|counter_offer|concession|escalation|information_request|walkaway_signal|close|scenario_inject|intelligence_briefing|adjudication
    content = Column(JSON)
    reasoning = Column(Text)
    deal_state_delta = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)

    wargame = relationship('Wargame', back_populates='turns')

    def to_dict(self):
        return {
            'id': self.id, 'wargame_id': self.wargame_id, 'round_number': self.round_number,
            'participant_id': self.participant_id, 'actor_label': self.actor_label,
            'action_type': self.action_type, 'content': self.content, 'reasoning': self.reasoning,
            'deal_state_delta': self.deal_state_delta,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
