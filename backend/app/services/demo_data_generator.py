import random
import json
import uuid
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.complaint import Complaint
from app.models.ai_analysis import AIAnalysis
from app.models.officer import Officer
from app.models.assignment import ComplaintAssignment
from app.models.duplicate_group import DuplicateGroup
from app.models.escalation import Escalation
from app.models.history import ComplaintHistory
from app.core.security import get_password_hash

DEMO_PREFIX = "[DEMO DATA]"

CATEGORIES_MAP = {
    "Roads & Infrastructure": {
        "department": "Public Works Department (PWD)",
        "subcategories": ["Pothole Hazard", "Damaged Footpath", "Broken Divider", "Asphalt Degradation", "Missing Road Sign"],
        "issues": [
            ("Deep Dangerous Pothole Cluster near School Zone", "Large pothole cluster on main road posing severe collision risk for morning school buses and two-wheelers."),
            ("Cave-in on Arterial Roadway", "Section of asphalt has subsided creating a 3-foot trench across the main transit lane."),
            ("Damaged Pedestrian Footpath & Broken Tiles", "Footpath pavement tiles completely shattered forcing pedestrians to walk on busy traffic lanes."),
            ("Broken Central Road Divider", "Concrete road divider damaged after vehicle impact leaving exposed rebar and traffic obstruction."),
            ("Missing Stop Sign & Damaged Traffic Signal", "Critical traffic direction sign knocked over at major 4-way intersection.")
        ]
    },
    "Water Supply & Sewerage": {
        "department": "Delhi Jal Board (DJB)",
        "subcategories": ["Main Pipeline Leakage", "Low Water Pressure", "Contaminated Tap Water", "Sewer Line Blockage", "Broken Main Valve"],
        "issues": [
            ("Underground High-Pressure Pipe Leakage", "Water gushing from underground pipeline burst, flooding local market street and wasting clean supply."),
            ("Severe Low Water Pressure in Residential Block", "Water pressure dropped significantly for 3 consecutive days across 120 households."),
            ("Contaminated Turbid Supply in Taps", "Tap water supplied during morning hours is dark yellow with foul odor and sediment."),
            ("Main Sewer Line Overflow on Public Street", "Overfilled sewer line spewing untreated sewage onto public road creating severe health hazard."),
            ("Faulty Underground Water Distribution Valve", "Water control valve jammed open, preventing supply distribution to lower sector wards.")
        ]
    },
    "Sanitation & Waste Management": {
        "department": "Municipal Sanitation Department",
        "subcategories": ["Uncollected Garbage Dump", "Overflowing Bin", "Dead Animal Removal", "Market Littering", "Illegal Commercial Dumping"],
        "issues": [
            ("Massive Uncollected Waste Dump at Sector Corner", "Garbage collection truck missed site for 4 days. Waste accumulating rapidly with stray animals."),
            ("Overflowing Community Waste Container", "Large municipal bin overflowing onto road, blocking half of pedestrian walkway."),
            ("Urgent Dead Animal Removal Required", "Carcass lying near public park entrance requiring immediate sanitary disposal crew."),
            ("Uncleared Commercial Market Litter", "Vegetable market refuse left uncleaned after evening market close attracting pests."),
            ("Illegal Construction Debris Dumping", "Concrete rubble and plaster debris dumped illegally along residential boundary wall.")
        ]
    },
    "Electrical & Street Lighting": {
        "department": "State Electricity Distribution Board",
        "subcategories": ["Flickering Streetlight", "Dark Alley Hazard", "Exposed Live Wire", "Transformer Sparking", "Pole Leaning"],
        "issues": [
            ("Entire Streetlight Circuit Blackout on Main Road", "12 consecutive streetlights non-functional creating dangerous dark stretch for night commuters."),
            ("Exposed Underground Power Cable", "Electrical cable exposed after monsoon soil erosion near children play area."),
            ("Sparking Local Distribution Transformer", "Pole transformer sparking loudly during peak evening load hours, risk of fire hazard."),
            ("Flickering LED Streetlight Unit", "High-mast lighting fixture flickering erratically, causing visual discomfort and unsafe conditions."),
            ("Severely Tilted Electric Pole", "Utility pole leaning precariously after heavy rain storm, threatening overhead lines.")
        ]
    },
    "Drainage & Stormwater": {
        "department": "Stormwater & Drainage Maintenance",
        "subcategories": ["Clogged Storm Drain", "Rainwater Stagnation", "Broken Gully Trap", "Monsoon Waterlogging", "Drain Wall Collapse"],
        "issues": [
            ("Blocked Gully Grate Causing Waterlogging", "Stormwater drain inlet choked with plastic bags and leaves, resulting in knee-deep water standing after rain."),
            ("Collapsing Masonry Wall of Open Drain", "Brick wall of main stormwater drain collapsed into channel restricting flood discharge."),
            ("Monsoon Water Stagnation in Underpass", "Low-lying transit underpass flooded due to non-functional automated drainage pump."),
            ("Uncovered Drain Manhole Trap", "Heavy concrete cover missing from main roadside drain channel, severe fall hazard."),
            ("Silt Accumulation in Drainage Channel", "Heavy silt accumulation reduced drain capacity by 70% causing local urban flooding.")
        ]
    },
    "Public Health & Environment": {
        "department": "Public Health & Environment Department",
        "subcategories": ["Stagnant Water Mosquito Risk", "Illegal Plastic Burning", "Public Washroom Defect", "Hazardous Chemical Discharge"],
        "issues": [
            ("Mosquito Breeding Pool in Abandoned Plot", "Stagnant rainwater pool accumulated in vacant plot breeding dengue larvae."),
            ("Open Burning of Plastic & Garbage Dumping", "Nighttime illegal waste burning releasing toxic smoke near residential apartment complex."),
            ("Unsanitary Condition of Public Washroom", "Public toilet facility locked and uncleaned with overflowing septic tank."),
            ("Stagnant Water Accumulation near Market", "Standing wastewater pool behind food market causing foul smell and health hazard.")
        ]
    }
}

WARDS = [f"Ward {i}" for i in range(1, 13)]

OFFICERS_SEED = [
    {"name": "Er. Rajesh Kumar", "department": "Public Works Department (PWD)", "assigned_area": "Ward 4", "specialization": "Roads & Asphalt Paving"},
    {"name": "Er. Sunita Sharma", "department": "Delhi Jal Board (DJB)", "assigned_area": "Ward 2", "specialization": "Water Supply & Hydraulics"},
    {"name": "Insp. Amit Verma", "department": "Municipal Sanitation Department", "assigned_area": "Ward 1", "specialization": "Solid Waste & Sanitation"},
    {"name": "Tech. Vikram Singh", "department": "State Electricity Distribution Board", "assigned_area": "Ward 3", "specialization": "Power Distribution & Lighting"},
    {"name": "Dr. Meena Gupta", "department": "Public Health & Environment Department", "assigned_area": "Ward 5", "specialization": "Environmental Health"},
    {"name": "Er. Alok Nath", "department": "Stormwater & Drainage Maintenance", "assigned_area": "Ward 6", "specialization": "Drainage & Flood Control"},
    {"name": "Er. Suresh Patel", "department": "Public Works Department (PWD)", "assigned_area": "Ward 8", "specialization": "Structural Infrastructure"},
    {"name": "Insp. Priya Nair", "department": "Municipal Sanitation Department", "assigned_area": "Ward 7", "specialization": "Waste Logistics & Collection"}
]

PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
STATUSES = ["SUBMITTED", "AI_ANALYSED", "ASSIGNED", "IN_PROGRESS", "UNDER_VERIFICATION", "RESOLVED", "CLOSED", "ESCALATED"]

class DemoDataGenerator:
    
    @staticmethod
    def generate_demo_dataset(db: Session, count: int = 100) -> dict:
        """
        Generates exactly 100 realistic synthetic citizen complaints, AI analyses, 
        officer assignments, duplicate clusters, and escalations.
        All synthetic records are clearly tagged with [DEMO DATA].
        """
        # 1. Ensure Demo Citizen User exists
        demo_user = db.query(User).filter(User.email == "demo.citizen@jansahayak.gov.in").first()
        if not demo_user:
            demo_user = User(
                id=str(uuid.uuid4()),
                name="Demo Citizen User",
                email="demo.citizen@jansahayak.gov.in",
                phone="+91-9876543210",
                role="citizen",
                hashed_password=get_password_hash("demopassword123")
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)

        # 2. Ensure Seeded Officers exist
        existing_officers = db.query(Officer).all()
        officers_by_dept = {}
        
        if len(existing_officers) < len(OFFICERS_SEED):
            for off_data in OFFICERS_SEED:
                existing = db.query(Officer).filter(Officer.name == off_data["name"]).first()
                if not existing:
                    officer = Officer(
                        id=str(uuid.uuid4()),
                        name=off_data["name"],
                        department=off_data["department"],
                        assigned_area=off_data["assigned_area"],
                        current_workload=0,
                        specialization=off_data["specialization"]
                    )
                    db.add(officer)
                    db.commit()
                    db.refresh(officer)
                    existing = officer
                
                dept = off_data["department"]
                if dept not in officers_by_dept:
                    officers_by_dept[dept] = []
                officers_by_dept[dept].append(existing)
        else:
            for off in existing_officers:
                dept = off.department
                if dept not in officers_by_dept:
                    officers_by_dept[dept] = []
                officers_by_dept[dept].append(off)

        all_officers = db.query(Officer).all()

        # 3. Base Coordinates around Delhi/NCR
        base_lat = 28.6139
        base_lng = 77.2090

        created_complaints = []
        now = datetime.utcnow()

        categories_keys = list(CATEGORIES_MAP.keys())

        # Distribution targets for 100 items:
        # Priority: CRITICAL (~20), HIGH (~30), MEDIUM (~35), LOW (~15)
        # Status: RESOLVED (~30), ESCALATED (~15), IN_PROGRESS (~25), ASSIGNED (~15), AI_ANALYSED (~10), SUBMITTED (~5)

        for i in range(1, count + 1):
            category_name = categories_keys[(i - 1) % len(categories_keys)]
            cat_data = CATEGORIES_MAP[category_name]
            department = cat_data["department"]
            subcategory = random.choice(cat_data["subcategories"])
            issue_title_base, issue_desc_base = random.choice(cat_data["issues"])

            ward = WARDS[(i - 1) % len(WARDS)]
            address = f"Sector {(i % 24) + 1}, Near Block {(i % 8) + 1} Marker, {ward}, New Delhi"

            # Latitude / Longitude random offsets
            lat = round(base_lat + random.uniform(-0.08, 0.08), 6)
            lng = round(base_lng + random.uniform(-0.08, 0.08), 6)

            # Assign Priority
            if i % 5 == 0:
                priority = "CRITICAL"
                priority_score = round(random.uniform(85.0, 98.0), 1)
            elif i % 3 == 0:
                priority = "HIGH"
                priority_score = round(random.uniform(65.0, 84.9), 1)
            elif i % 2 == 0:
                priority = "MEDIUM"
                priority_score = round(random.uniform(40.0, 64.9), 1)
            else:
                priority = "LOW"
                priority_score = round(random.uniform(20.0, 39.9), 1)

            # Assign Status
            if i <= 30:
                status = "RESOLVED"
            elif i <= 45:
                status = "ESCALATED"
            elif i <= 70:
                status = "IN_PROGRESS"
            elif i <= 85:
                status = "ASSIGNED"
            elif i <= 95:
                status = "AI_ANALYSED"
            else:
                status = "SUBMITTED"

            # SLA & Creation dates spread over past 30 days
            days_ago = random.randint(1, 28)
            created_at = now - timedelta(days=days_ago, hours=random.randint(1, 12))
            
            sla_hours = 24.0 if priority == "CRITICAL" else (36.0 if priority == "HIGH" else 48.0)
            sla_deadline = created_at + timedelta(hours=sla_hours)
            is_sla_breached = (status == "ESCALATED") or (now > sla_deadline and status not in ["RESOLVED", "CLOSED"])

            # Impact Score
            impact_score = round(priority_score * random.uniform(0.9, 1.1), 1)
            impact_score = min(99.0, max(25.0, impact_score))

            # Clearly distinguish DEMO data in title
            title = f"{DEMO_PREFIX} {issue_title_base} ({ward})"
            description = f"{issue_desc_base} [Synthetic Demo Complaint Record #{i:03d} generated for JanSahayak AI evaluation]."

            complaint = Complaint(
                id=str(uuid.uuid4()),
                user_id=demo_user.id,
                title=title,
                description=description,
                category=category_name,
                subcategory=subcategory,
                department=department,
                priority=priority,
                priority_score=priority_score,
                status=status,
                latitude=lat,
                longitude=lng,
                address=address,
                image_url=f"https://images.unsplash.com/photo-{1580000000000 + (i * 1000)}?auto=format&fit=crop&w=800&q=80" if i % 3 == 0 else None,
                impact_score=impact_score,
                sla_hours=sla_hours,
                sla_deadline=sla_deadline,
                is_sla_breached=is_sla_breached,
                escalation_level=2 if status == "ESCALATED" and priority == "CRITICAL" else (1 if status == "ESCALATED" else 0),
                created_at=created_at,
                updated_at=created_at + timedelta(hours=random.randint(2, 24))
            )

            db.add(complaint)
            created_complaints.append(complaint)

        db.commit()

        # 4. Generate AI Analysis records for all complaints
        for comp in created_complaints:
            confidence = round(random.uniform(0.72, 0.96), 2)
            if comp.priority == "CRITICAL":
                reasons = [
                    "Public safety hazard evaluated by JanSahayak AI vision & text engine",
                    f"Located near sensitive landmark in {comp.address}",
                    f"High urgency priority score {comp.priority_score}/100",
                    "Multiple citizen reports corroborated in sector"
                ]
            else:
                reasons = [
                    f"Standard municipal classification for {comp.category}",
                    f"Urgency score {comp.priority_score}/100 based on description keywords",
                    f"Target turnaround SLA: {comp.sla_hours} hours"
                ]

            impact_factors = [
                f"Location Density: {comp.address} (+20 pts)",
                f"Disruption Level: Operational impact on transit/civic flow (+18 pts)",
                f"Urgency Multiplier: Priority {comp.priority} factor applied"
            ]

            resolution_factors = [
                f"Category Turnaround Benchmark: {comp.category} standard",
                f"Priority Expedite Multiplier: {comp.priority}",
                f"Active Officer Queue Workload factor applied"
            ]

            analysis = AIAnalysis(
                id=str(uuid.uuid4()),
                complaint_id=comp.id,
                category=comp.category,
                subcategory=comp.subcategory,
                department=comp.department,
                priority=comp.priority,
                priority_score=comp.priority_score,
                priority_reasons=json.dumps(reasons),
                severity="Critical" if comp.priority == "CRITICAL" else ("High" if comp.priority == "HIGH" else "Medium"),
                summary=f"Automated AI classification for {comp.title}. Recommended field crew dispatch.",
                impact_score=comp.impact_score,
                impact_level="Critical" if comp.impact_score >= 85 else ("High" if comp.impact_score >= 65 else "Medium"),
                impact_factors=json.dumps(impact_factors),
                duplicate_probability=round(random.uniform(15.0, 92.0), 1),
                estimated_resolution_time=f"{int(comp.sla_hours)} hours",
                root_cause=f"AI Hypothesis: Infrastructure strain & localized degradation pattern in {comp.category}.",
                recommended_action=f"Dispatch {comp.department} field inspection unit.",
                confidence=confidence,
                evidence_status="SUPPORTED" if confidence >= 0.70 else "NEEDS_HUMAN_VERIFICATION",
                evidence_verification_score=round(confidence * 100, 1),
                human_review_flagged="false" if confidence >= 0.70 else "true",
                resolution_estimation_details=json.dumps({
                    "estimated_resolution": f"{int(comp.sla_hours)} hours",
                    "confidence": "High" if confidence >= 0.85 else "Medium",
                    "is_historical_data_based": True,
                    "estimate_label": "Historical Resolution Average",
                    "estimation_factors": resolution_factors
                })
            )
            db.add(analysis)

        db.commit()

        # 5. Seed Officer Assignments for ASSIGNED, IN_PROGRESS, UNDER_VERIFICATION, RESOLVED, ESCALATED
        assigned_complaints = [c for c in created_complaints if c.status in ["ASSIGNED", "IN_PROGRESS", "UNDER_VERIFICATION", "RESOLVED", "ESCALATED"]]
        for comp in assigned_complaints:
            # Pick officer matching department if possible
            dept_officers = officers_by_dept.get(comp.department, all_officers)
            officer = random.choice(dept_officers) if dept_officers else random.choice(all_officers)

            assignment = ComplaintAssignment(
                id=str(uuid.uuid4()),
                complaint_id=comp.id,
                officer_id=officer.id,
                assigned_at=comp.created_at + timedelta(hours=1)
            )
            db.add(assignment)
            officer.current_workload += 1

            # History entry for assignment
            history = ComplaintHistory(
                id=str(uuid.uuid4()),
                complaint_id=comp.id,
                status="ASSIGNED",
                comment=f"Assigned to Officer {officer.name} ({officer.department})",
                changed_by="SYSTEM_AUTO_DISPATCH",
                timestamp=comp.created_at + timedelta(hours=1)
            )
            db.add(history)

            if comp.status in ["RESOLVED", "CLOSED"]:
                res_history = ComplaintHistory(
                    id=str(uuid.uuid4()),
                    complaint_id=comp.id,
                    status="RESOLVED",
                    comment=f"Resolved on site by Officer {officer.name}. Field inspection report verified.",
                    changed_by=officer.name,
                    timestamp=comp.created_at + timedelta(hours=random.randint(10, 30))
                )
                db.add(res_history)

        db.commit()

        # 6. Seed Escalation records for ESCALATED complaints
        escalated_list = [c for c in created_complaints if c.status == "ESCALATED"]
        for comp in escalated_list:
            esc = Escalation(
                id=str(uuid.uuid4()),
                complaint_id=comp.id,
                current_level=comp.escalation_level or 1,
                escalated_to="Ward Supervisor / Municipal Commissioner",
                reason=f"SLA threshold of {comp.sla_hours} hours exceeded for {comp.priority} priority grievance.",
                timestamp=comp.sla_deadline + timedelta(hours=2) if comp.sla_deadline else comp.created_at + timedelta(hours=24)
            )
            db.add(esc)

            esc_history = ComplaintHistory(
                id=str(uuid.uuid4()),
                complaint_id=comp.id,
                status="ESCALATED",
                comment=f"Automatic SLA Escalation to Level {comp.escalation_level or 1} Authority.",
                changed_by="JANSAHAYAK_SLA_ENGINE",
                timestamp=esc.timestamp
            )
            db.add(esc_history)

        db.commit()

        # 7. Seed Duplicate Complaint Clusters (6 Clusters)
        duplicate_clusters = [
            {
                "issue": "Underground Water Pipe Leakage Cluster",
                "category": "Water Supply & Sewerage",
                "root_cause": "Corroded main supply pipe joint near Ward 4 market transit line",
                "investigation": "Deploy DJB underground pipe sonar inspection crew",
                "status": "Confirmed"
            },
            {
                "issue": "Massive Uncollected Market Waste Dump",
                "category": "Sanitation & Waste Management",
                "root_cause": "Sanitation vehicle route breakdown & missed collection shift",
                "investigation": "Inspect Municipal compactor vehicle logs & dispatch backup compactor",
                "status": "Confirmed"
            },
            {
                "issue": "Streetlight Circuit Blackout Corridor",
                "category": "Electrical & Street Lighting",
                "root_cause": "Feeder pillar circuit breaker trip due to line overload",
                "investigation": "Inspect Ward 3 main electrical feeder distribution box",
                "status": "Needs Investigation"
            },
            {
                "issue": "Stormwater Drain Overflow & Waterlogging",
                "category": "Drainage & Stormwater",
                "root_cause": "Heavy silt & plastic obstruction in main gully trap",
                "investigation": "Deploy suction jetting machine to clear drain channel",
                "status": "Needs Investigation"
            },
            {
                "issue": "Arterial Road Pothole Hazard Stretch",
                "category": "Roads & Infrastructure",
                "root_cause": "Monsoon water seepage and heavy commercial vehicle axle load wear",
                "investigation": "Schedule cold-mix asphalt patch repair and road drainage audit",
                "status": "Confirmed"
            },
            {
                "issue": "Stagnant Water Mosquito Breeding Site",
                "category": "Public Health & Environment",
                "root_cause": "Rainwater accumulation in abandoned construction plot",
                "investigation": "Issue notice to landowner & conduct anti-larval chemical spray",
                "status": "Needs Investigation"
            }
        ]

        for cluster in duplicate_clusters:
            matching = [c.id for c in created_complaints if c.category == cluster["category"]][:4]
            if not matching:
                matching = [c.id for c in created_complaints[:4]]

            dup_group = DuplicateGroup(
                group_id=str(uuid.uuid4()),
                complaint_ids=matching,
                similarity_score=round(random.uniform(0.84, 0.96), 2),
                similarity_percentage=f"{random.randint(84, 96)}%",
                common_issue=f"{DEMO_PREFIX} {cluster['issue']}",
                category=cluster["category"],
                status="ACTIVE",
                affected_citizen_count=len(matching) * 8 + random.randint(5, 20),
                possible_root_cause=cluster["root_cause"],
                root_cause_confidence="High" if cluster["status"] == "Confirmed" else "Medium",
                recommended_investigation=cluster["investigation"],
                root_cause_status=cluster["status"],
                analysis_summary=f"AI vector cluster grouped {len(matching)} citizen complaints with spatial & semantic keyword alignment.",
                is_ai_hypothesis="true"
            )
            db.add(dup_group)

        db.commit()

        return {
            "status": "success",
            "message": f"Successfully generated {len(created_complaints)} synthetic Demo Complaint records across 12 Wards and 6 Departments.",
            "generated_count": len(created_complaints),
            "duplicate_groups_count": len(duplicate_clusters),
            "escalated_count": len(escalated_list),
            "officers_count": len(all_officers),
            "demo_tag": DEMO_PREFIX
        }

    @staticmethod
    def clear_demo_data(db: Session) -> dict:
        """
        Clears all synthetic demo complaint data without affecting production user records.
        """
        demo_complaints = db.query(Complaint).filter(Complaint.title.like(f"%{DEMO_PREFIX}%")).all()
        demo_ids = [c.id for c in demo_complaints]

        if demo_ids:
            # Delete AI Analyses
            db.query(AIAnalysis).filter(AIAnalysis.complaint_id.in_(demo_ids)).delete(synchronize_session=False)
            # Delete Assignments
            db.query(ComplaintAssignment).filter(ComplaintAssignment.complaint_id.in_(demo_ids)).delete(synchronize_session=False)
            # Delete Escalations
            db.query(Escalation).filter(Escalation.complaint_id.in_(demo_ids)).delete(synchronize_session=False)
            # Delete Histories
            db.query(ComplaintHistory).filter(ComplaintHistory.complaint_id.in_(demo_ids)).delete(synchronize_session=False)
            # Delete Complaints
            db.query(Complaint).filter(Complaint.id.in_(demo_ids)).delete(synchronize_session=False)

        # Delete Demo Duplicate Groups
        db.query(DuplicateGroup).filter(DuplicateGroup.common_issue.like(f"%{DEMO_PREFIX}%")).delete(synchronize_session=False)

        db.commit()

        return {
            "status": "success",
            "message": f"Cleared {len(demo_ids)} demo complaint records.",
            "cleared_count": len(demo_ids)
        }
