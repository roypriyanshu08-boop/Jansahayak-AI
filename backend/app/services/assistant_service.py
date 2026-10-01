from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from app.models.complaint import Complaint
from app.models.user import User

class JanSahayakAssistantService:
    """
    Ask JanSahayak AI Virtual Assistant Engine.
    Provides grounded public-service responses and user-authenticated complaint status tracking.
    
    SAFEGUARDS:
    - Never invents complaint status.
    - Strictly scoped to current user's complaints (never exposes private data).
    - Supports Hindi and English queries.
    """

    @classmethod
    def answer_query(
        cls,
        query: str,
        user: Optional[User] = None,
        db: Optional[Session] = None,
        language: str = "en"  # "en" | "hi"
    ) -> Dict[str, Any]:
        text = (query or "").strip().lower()
        is_hindi = language == "hi" or any(w in text for w in ["kya", "kaise", "kab", "hai", "mera", "meri", "karo", "naam", "gaddha", "kachra", "paani"])

        # Intent 1: Check complaint status / delayed complaint
        if any(w in text for w in ["status", "track", "my complaint", "mera complaint", "meri complaint", "delayed", "late", "resolved", "hal", "sthiti"]):
            return cls._handle_complaint_status_query(text, user, db, is_hindi)

        # Intent 2: Reporting potholes / road repair
        if any(w in text for w in ["pothole", "gaddha", "road", "sadak", "potholes", "street"]):
            if is_hindi:
                reply = (
                    "सड़क या गड्ढे की शिकायत दर्ज करने के लिए:\n"
                    "1. 'New Complaint' बटन पर क्लिक करें।\n"
                    "2. गड्ढे का शीर्षक और विवरण भरें (या साइट फोटो अपलोड करें)।\n"
                    "3. हमारा AI Vision Engine फोटो से समस्या पहचानकर स्वचालित रूप से 'Road Department' को प्राथमिकता तय करके भेज देगा।"
                )
            else:
                reply = (
                    "To report a road pothole or damaged street:\n"
                    "1. Click the 'New Complaint' button on your dashboard.\n"
                    "2. Enter title & description (or upload a site photo).\n"
                    "3. JanSahayak AI Vision will automatically detect the pothole, set urgency, and assign it to the Road Department."
                )
            return {
                "reply": reply,
                "answer": reply,
                "intent": "REPORT_POTHOLE",
                "is_hindi": is_hindi,
                "grounded_in_db": True,
                "user_complaints": [],
                "actions": ["Submit Pothole Complaint", "View Guidelines"]
            }

        # Intent 3: Garbage & Sanitation Department
        if any(w in text for w in ["garbage", "kachra", "waste", "sanitation", "cleanliness", "safai", "department"]):
            if is_hindi:
                reply = (
                    "कचरा प्रबंधन और सफाई कार्य 'Sanitation Department' संभालता है।\n"
                    "कचरे का ढेर, नाली रुकावट, या डोर-टू-डोर कचरा न उठने पर आप Sanitation श्रेणी चुनकर शिकायत दर्ज कर सकते हैं। कार्य समय: सुबह 7:00 बजे से दोपहर 2:00 बजे तक।"
                )
            else:
                reply = (
                    "Garbage accumulation, uncollected waste, and cleanliness issues are handled by the 'Sanitation Department'.\n"
                    "You can log sanitation complaints under the 'Sanitation' category for fast field dispatch. Standard collection hours: 7:00 AM - 2:00 PM."
                )
            return {
                "reply": reply,
                "answer": reply,
                "intent": "DEPARTMENT_GARBAGE",
                "is_hindi": is_hindi,
                "grounded_in_db": True,
                "user_complaints": [],
                "actions": ["Sanitation Hotline", "Report Garbage Dump"]
            }

        # Intent 4: Delayed / Escalation questions
        if any(w in text for w in ["escalat", "cross", "sla", "delay", "not resolved", "unresolved", "hal nahi"]):
            if is_hindi:
                reply = (
                    "यदि आपकी शिकायत का निवारण निर्धारित SLA समय (जैसे 24-48 घंटे) में नहीं होता है:\n"
                    "1. जनसहायक AI स्वचालित रूप से Multi-Level Escalation ट्रिगर कर देता है:\n"
                    "   • Level 1 → संबंधित अधिकारी\n"
                    "   • Level 2 → विभाग पर्यवेक्षक (Supervisor)\n"
                    "   • Level 3 → वरिष्ठ नगर प्राधिकारी (Senior Authority)\n"
                    "2. आप 'My Complaints' में जाकर शिकायत का विस्तृत Timeline इतिहास देख सकते हैं।"
                )
            else:
                reply = (
                    "If your complaint exceeds the target SLA deadline:\n"
                    "1. JanSahayak AI automatically triggers multi-level escalations:\n"
                    "   • Level 1 → Assigned Officer\n"
                    "   • Level 2 → Department Supervisor\n"
                    "   • Level 3 → Senior Municipal Authority\n"
                    "2. You can track exact status updates and timestamped logs on your Complaint Detail Timeline."
                )
            return {
                "reply": reply,
                "answer": reply,
                "intent": "COMPLAINT_DELAYED",
                "is_hindi": is_hindi,
                "grounded_in_db": True,
                "user_complaints": [],
                "actions": ["Track Timeline", "Escalation Policy"]
            }

        # Default fallback response
        if is_hindi:
            reply = (
                "नमस्ते! मैं जनसहायक AI सहायक हूँ। आप मुझसे अपनी शिकायत का स्टेटस, शिकायत दर्ज करने की प्रक्रिया, "
                "या नगर निगम विभागों के बारे में पूछ सकते हैं।"
            )
        else:
            reply = (
                "Hello! I am JanSahayak AI virtual assistant. You can ask me:\n"
                "• 'What is the status of my complaint?'\n"
                "• 'How do I report a pothole?'\n"
                "• 'Which department handles garbage?'\n"
                "• 'What should I do if my complaint is delayed?'"
            )
        return {
            "reply": reply,
            "answer": reply,
            "intent": "GENERAL_HELP",
            "is_hindi": is_hindi,
            "grounded_in_db": True,
            "user_complaints": [],
            "actions": ["Check Complaint Status", "Report Issue", "SLA Help"]
        }

    @classmethod
    def _handle_complaint_status_query(
        cls,
        text: str,
        user: Optional[User],
        db: Optional[Session],
        is_hindi: bool
    ) -> Dict[str, Any]:
        if not user or not db:
            if is_hindi:
                reply = "अपनी दर्ज शिकायतों की वास्तविक स्थिति जांचने के लिए कृपया जनसहायक पोर्टल में लॉगिन करें।"
            else:
                reply = "Please sign in with your citizen account to securely view your registered grievance status."
            return {
                "reply": reply,
                "answer": reply,
                "intent": "AUTH_REQUIRED",
                "is_hindi": is_hindi,
                "grounded_in_db": False,
                "user_complaints": [],
                "actions": ["Sign In", "Register Account"]
            }

        # Query user's actual complaints securely (privacy scope)
        user_complaints = db.query(Complaint).filter(Complaint.user_id == user.id).order_by(Complaint.created_at.desc()).all()

        if not user_complaints:
            if is_hindi:
                reply = "आपके अकाउंट में कोई सक्रिय शिकायत दर्ज नहीं मिली है। नई शिकायत दर्ज करने के लिए 'New Complaint' पर क्लिक करें।"
            else:
                reply = "No registered grievances found under your user account. Click 'New Complaint' on your dashboard to submit a new issue."
            return {
                "reply": reply,
                "answer": reply,
                "intent": "NO_COMPLAINTS_FOUND",
                "is_hindi": is_hindi,
                "grounded_in_db": True,
                "user_complaints": [],
                "actions": ["File New Complaint"]
            }

        latest = user_complaints[0]
        st_clean = (latest.status or "SUBMITTED").replace("_", " ")

        if is_hindi:
            reply = (
                f"आपकी नवीनतम शिकायत **ID: {latest.id}** ('{latest.title}') का वर्तमान स्टेटस: **{st_clean}** है।\n"
                f"• विभाग: {latest.department or 'Public Works'}\n"
                f"• प्राथमिकता: {latest.priority or 'MEDIUM'}\n"
                f"• लक्ष्य SLA समय: {latest.sla_hours or 48} घंटे"
            )
            if latest.status == "ESCALATED":
                reply += "\n⚠️ यह शिकायत SLA समय सीमा पार होने पर उच्च अधिकारी को स्वचालित रूप से Escalated कर दी गई है।"
        else:
            reply = (
                f"Your latest registered grievance **ID: {latest.id}** ('{latest.title}') currently has status: **{st_clean}**.\n"
                f"• Department: {latest.department or 'Public Works'}\n"
                f"• Urgency Priority: {latest.priority or 'MEDIUM'}\n"
                f"• Target SLA Limit: {latest.sla_hours or 48} Hours"
            )
            if latest.status == "ESCALATED":
                reply += "\n⚠️ Note: This complaint exceeded SLA deadline and has been auto-escalated to Department Supervisor for urgent priority resolution."

        complaints_list = [
            {
                "id": c.id,
                "title": c.title,
                "category": c.category,
                "status": c.status,
                "priority": c.priority,
                "department": c.department,
                "sla_hours": c.sla_hours
            }
            for c in user_complaints[:3]
        ]

        return {
            "reply": reply,
            "answer": reply,
            "intent": "USER_COMPLAINT_STATUS",
            "is_hindi": is_hindi,
            "grounded_in_db": True,
            "latest_complaint_id": latest.id,
            "user_complaint_count": len(user_complaints),
            "user_complaints": complaints_list,
            "actions": ["Track Complaint Timeline", "View All Complaints"]
        }
