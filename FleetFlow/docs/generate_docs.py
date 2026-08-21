"""
FleetFlow Documentation PDF Generator
Generates a concise, well-designed project documentation PDF.
Run from: FleetFlow/Backend directory (with venv activated)
Or from anywhere with: python generate_docs.py
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak, KeepTogether
)
from reportlab.platypus.flowables import HRFlowable
from reportlab.graphics.shapes import Drawing, Rect, String, Line, Polygon
from reportlab.graphics import renderPDF
from datetime import datetime
import os

# ── Output path ──────────────────────────────────────────────────────────────
OUTPUT_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "FleetFlow_Documentation.pdf")

# ── Brand Colors ──────────────────────────────────────────────────────────────
DARK_BG     = colors.HexColor("#0d1117")
NAVY        = colors.HexColor("#161b22")
CARD_BG     = colors.HexColor("#21262d")
BLUE        = colors.HexColor("#58a6ff")
BLUE_DARK   = colors.HexColor("#1f6feb")
GREEN       = colors.HexColor("#3fb950")
AMBER       = colors.HexColor("#d29922")
RED         = colors.HexColor("#f85149")
PURPLE      = colors.HexColor("#bc8cff")
TEXT_PRI    = colors.HexColor("#e6edf3")
TEXT_SEC    = colors.HexColor("#8b949e")
BORDER      = colors.HexColor("#30363d")
WHITE       = colors.white
TEAL        = colors.HexColor("#39d353")

PAGE_W, PAGE_H = A4


# ─────────────────────────────────────────────────────────────────────────────
# STYLE DEFINITIONS
# ─────────────────────────────────────────────────────────────────────────────
def build_styles():
    base = getSampleStyleSheet()

    styles = {}

    styles["cover_title"] = ParagraphStyle(
        "cover_title",
        fontName="Helvetica-Bold",
        fontSize=32,
        textColor=WHITE,
        alignment=TA_CENTER,
        spaceAfter=6,
        leading=38,
    )
    styles["cover_subtitle"] = ParagraphStyle(
        "cover_subtitle",
        fontName="Helvetica",
        fontSize=13,
        textColor=BLUE,
        alignment=TA_CENTER,
        spaceAfter=4,
    )
    styles["cover_meta"] = ParagraphStyle(
        "cover_meta",
        fontName="Helvetica",
        fontSize=10,
        textColor=TEXT_SEC,
        alignment=TA_CENTER,
        spaceAfter=3,
    )
    styles["section_heading"] = ParagraphStyle(
        "section_heading",
        fontName="Helvetica-Bold",
        fontSize=16,
        textColor=BLUE,
        spaceBefore=14,
        spaceAfter=6,
        leading=20,
    )
    styles["sub_heading"] = ParagraphStyle(
        "sub_heading",
        fontName="Helvetica-Bold",
        fontSize=11,
        textColor=WHITE,
        spaceBefore=8,
        spaceAfter=4,
        leading=15,
    )
    styles["body"] = ParagraphStyle(
        "body",
        fontName="Helvetica",
        fontSize=9.5,
        textColor=TEXT_PRI,
        leading=15,
        spaceAfter=5,
        alignment=TA_JUSTIFY,
    )
    styles["bullet"] = ParagraphStyle(
        "bullet",
        fontName="Helvetica",
        fontSize=9.5,
        textColor=TEXT_PRI,
        leading=14,
        spaceAfter=3,
        leftIndent=14,
        bulletIndent=0,
    )
    styles["caption"] = ParagraphStyle(
        "caption",
        fontName="Helvetica-Oblique",
        fontSize=8,
        textColor=TEXT_SEC,
        alignment=TA_CENTER,
        spaceAfter=4,
    )
    styles["tag"] = ParagraphStyle(
        "tag",
        fontName="Helvetica-Bold",
        fontSize=8,
        textColor=BLUE,
        alignment=TA_CENTER,
    )
    styles["toc_item"] = ParagraphStyle(
        "toc_item",
        fontName="Helvetica",
        fontSize=10,
        textColor=TEXT_PRI,
        leading=18,
        leftIndent=10,
    )
    styles["footer"] = ParagraphStyle(
        "footer",
        fontName="Helvetica",
        fontSize=8,
        textColor=TEXT_SEC,
        alignment=TA_CENTER,
    )

    return styles


# ─────────────────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────────────────
def hr(color=BORDER, thickness=0.8):
    return HRFlowable(width="100%", thickness=thickness, color=color, spaceAfter=6, spaceBefore=6)


def colored_table(data, col_widths, row_heights=None,
                  header_bg=BLUE_DARK, alt_bg=CARD_BG, border=BORDER):
    style = [
        ("BACKGROUND",  (0, 0), (-1, 0),  header_bg),
        ("TEXTCOLOR",   (0, 0), (-1, 0),  WHITE),
        ("FONTNAME",    (0, 0), (-1, 0),  "Helvetica-Bold"),
        ("FONTSIZE",    (0, 0), (-1, 0),  9),
        ("ALIGN",       (0, 0), (-1, -1), "LEFT"),
        ("VALIGN",      (0, 0), (-1, -1), "MIDDLE"),
        ("ROWBACKGROUND",(0, 1), (-1, -1), [CARD_BG, NAVY]),
        ("TEXTCOLOR",   (0, 1), (-1, -1), TEXT_PRI),
        ("FONTNAME",    (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE",    (0, 1), (-1, -1), 8.5),
        ("GRID",        (0, 0), (-1, -1), 0.4, border),
        ("TOPPADDING",  (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING",(0, 0), (-1,-1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING",(0, 0), (-1, -1), 7),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [CARD_BG, NAVY]),
    ]
    t = Table(data, colWidths=col_widths, rowHeights=row_heights, repeatRows=1)
    t.setStyle(TableStyle(style))
    return t


def badge_paragraph(text, color, styles):
    return Paragraph(f'<font color="#{color.hexval()[1:]}">{text}</font>', styles["bullet"])


def section_box(elements, title, styles, color=BLUE):
    """Draw a titled section - heading + HR"""
    elements.append(Paragraph(title, styles["section_heading"]))
    elements.append(hr(color=color, thickness=1.2))


# ─────────────────────────────────────────────────────────────────────────────
# PAGE BACKGROUND CANVAS
# ─────────────────────────────────────────────────────────────────────────────
def draw_page_background(canvas, doc):
    canvas.saveState()
    # Full dark background
    canvas.setFillColor(DARK_BG)
    canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)

    # Thin top accent bar
    canvas.setFillColor(BLUE_DARK)
    canvas.rect(0, PAGE_H - 4, PAGE_W, 4, fill=1, stroke=0)

    # Footer
    canvas.setFillColor(NAVY)
    canvas.rect(0, 0, PAGE_W, 22, fill=1, stroke=0)
    canvas.setFillColor(BORDER)
    canvas.rect(0, 22, PAGE_W, 0.5, fill=1, stroke=0)

    # Footer text
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(TEXT_SEC)
    canvas.drawString(doc.leftMargin, 8, "FleetFlow — Fleet Management & Logistics Tracking Platform")
    canvas.drawRightString(PAGE_W - doc.rightMargin, 8, f"Page {doc.page}")
    canvas.restoreState()


def draw_cover_background(canvas, doc):
    canvas.saveState()
    # Dark BG
    canvas.setFillColor(DARK_BG)
    canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    # Gradient-like top block
    canvas.setFillColor(NAVY)
    canvas.rect(0, PAGE_H * 0.52, PAGE_W, PAGE_H * 0.48, fill=1, stroke=0)
    # Blue accent bar
    canvas.setFillColor(BLUE_DARK)
    canvas.rect(0, PAGE_H * 0.52 - 3, PAGE_W, 3, fill=1, stroke=0)
    # Decorative circles
    canvas.setFillColor(colors.HexColor("#1f6feb"))
    canvas.setFillAlpha(0.08)
    canvas.circle(PAGE_W * 0.85, PAGE_H * 0.82, 120, fill=1, stroke=0)
    canvas.circle(PAGE_W * 0.1, PAGE_H * 0.72, 80, fill=1, stroke=0)
    canvas.setFillAlpha(1)
    # Bottom footer strip
    canvas.setFillColor(colors.HexColor("#010409"))
    canvas.rect(0, 0, PAGE_W, 35, fill=1, stroke=0)
    canvas.restoreState()


# ─────────────────────────────────────────────────────────────────────────────
# COVER PAGE
# ─────────────────────────────────────────────────────────────────────────────
def build_cover(styles):
    elements = []
    elements.append(Spacer(1, 5.5 * cm))

    # Icon / Logo placeholder box
    icon_drawing = Drawing(80, 80)
    icon_drawing.add(Rect(0, 0, 80, 80, rx=16, ry=16,
                          fillColor=BLUE_DARK, strokeColor=BLUE, strokeWidth=2))
    icon_drawing.add(String(18, 22, "FF", fontSize=28, fillColor=WHITE, fontName="Helvetica-Bold"))
    elements.append(icon_drawing)
    elements.append(Spacer(1, 0.4 * cm))

    elements.append(Paragraph("FleetFlow", styles["cover_title"]))
    elements.append(Paragraph("Fleet Management &amp; Logistics Tracking Platform", styles["cover_subtitle"]))
    elements.append(Spacer(1, 0.3 * cm))
    elements.append(hr(color=BLUE, thickness=1.5))
    elements.append(Spacer(1, 0.3 * cm))

    elements.append(Paragraph("Project Documentation", styles["cover_meta"]))
    elements.append(Paragraph("Infosys Internship Project", styles["cover_meta"]))
    elements.append(Paragraph(f"Generated: {datetime.now().strftime('%B %d, %Y')}", styles["cover_meta"]))
    elements.append(Spacer(1, 1.2 * cm))

    # Tech badges table
    badge_data = [
        ["FastAPI", "React 19", "PostgreSQL", "Docker"],
        ["Python 3.13", "SQLAlchemy", "JWT + RBAC", "WebSockets"],
    ]
    badge_style = [
        ("BACKGROUND",   (0, 0), (-1, -1), CARD_BG),
        ("TEXTCOLOR",    (0, 0), (-1, -1), BLUE),
        ("FONTNAME",     (0, 0), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE",     (0, 0), (-1, -1), 8.5),
        ("ALIGN",        (0, 0), (-1, -1), "CENTER"),
        ("GRID",         (0, 0), (-1, -1), 0.5, BLUE_DARK),
        ("TOPPADDING",   (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 6),
        ("ROUNDEDCORNERS", [5]),
    ]
    bt = Table(badge_data, colWidths=[3.5*cm]*4)
    bt.setStyle(TableStyle(badge_style))
    elements.append(bt)

    elements.append(PageBreak())
    return elements


# ─────────────────────────────────────────────────────────────────────────────
# 1. INTRODUCTION
# ─────────────────────────────────────────────────────────────────────────────
def build_introduction(styles):
    els = []
    section_box(els, "1. Introduction", styles)

    els.append(Paragraph(
        "<b>FleetFlow</b> is a full-stack, enterprise-grade Fleet Management and Logistics Tracking Platform "
        "developed as part of the Infosys Internship Program. It provides a centralized, real-time system "
        "for managing vehicles, drivers, shipments, fuel, maintenance, and logistics analytics — all secured "
        "with JWT-based authentication and role-based access control.",
        styles["body"]
    ))

    # Tech Stack table
    els.append(Spacer(1, 0.2*cm))
    els.append(Paragraph("Tech Stack", styles["sub_heading"]))
    ts_data = [
        ["Layer", "Technology"],
        ["Backend", "Python 3.13, FastAPI, SQLAlchemy 2.0"],
        ["Database", "PostgreSQL 16 + Alembic Migrations"],
        ["Authentication", "JWT (python-jose) + bcrypt"],
        ["Async Tasks", "Celery + Redis"],
        ["Reports", "ReportLab (PDF) + OpenPyXL (Excel)"],
        ["Frontend", "React 19, Vite 8, Axios"],
        ["Real-Time", "WebSockets (GPS Tracking)"],
        ["Deployment", "Docker Compose (6 services)"],
    ]
    els.append(colored_table(ts_data, [5*cm, 10*cm]))
    return els


# ─────────────────────────────────────────────────────────────────────────────
# 2. PROBLEM STATEMENT
# ─────────────────────────────────────────────────────────────────────────────
def build_problem_statement(styles):
    els = []
    section_box(els, "2. Problem Statement", styles, color=RED)

    els.append(Paragraph(
        "Modern logistics operations suffer from critical inefficiencies due to disconnected systems "
        "and manual processes. Fleet managers lack a unified platform to oversee vehicles, drivers, "
        "and deliveries in real time, leading to costly breakdowns, missed deliveries, and poor decisions.",
        styles["body"]
    ))

    els.append(Spacer(1, 0.2*cm))
    prob_data = [
        ["Challenge", "Business Impact"],
        ["No Real-Time Vehicle Tracking", "Delayed response, poor customer communication"],
        ["Manual Dispatch & Assignment", "Errors, bottlenecks, resource conflicts"],
        ["Reactive Maintenance", "Costly breakdowns, safety risks, downtime"],
        ["Fragmented Data (spreadsheets)", "No single source of truth, data loss"],
        ["No Analytics or Reporting", "Poor decision-making, no KPI visibility"],
        ["No Alerting System", "Critical events (overdue service) go unnoticed"],
    ]
    els.append(colored_table(prob_data, [7.5*cm, 7.5*cm], header_bg=colors.HexColor("#b91c1c")))
    return els


# ─────────────────────────────────────────────────────────────────────────────
# 3. OBJECTIVES
# ─────────────────────────────────────────────────────────────────────────────
def build_objectives(styles):
    els = []
    section_box(els, "3. Objectives", styles, color=GREEN)

    objectives = [
        ("Real-Time Vehicle Tracking", "GPS coordinates pushed live via WebSockets to all dashboard clients."),
        ("Intelligent Dispatch", "Create shipments, assign drivers/vehicles with full lifecycle management."),
        ("Proactive Maintenance", "Schedule records, auto-generate alerts (service due / overdue / health critical)."),
        ("Fuel Monitoring", "Log every fueling event; analytics on consumption, cost, and vehicle usage."),
        ("Driver Performance", "Track attendance, safety score, trip count, distance, and ratings per driver."),
        ("Role-Based Access Control", "4-tier RBAC: Admin → Fleet Manager → Dispatcher → Driver."),
        ("Analytics & Reports", "Operational KPIs + exportable PDF/Excel reports for all modules."),
        ("Notifications", "Multi-channel (push/email/SMS) alerts with priority levels and read tracking."),
    ]

    obj_data = [["#", "Objective", "Description"]]
    for i, (title, desc) in enumerate(objectives, 1):
        obj_data.append([str(i), title, desc])

    els.append(colored_table(obj_data, [0.8*cm, 5*cm, 9.2*cm], header_bg=colors.HexColor("#166534")))
    return els


# ─────────────────────────────────────────────────────────────────────────────
# 4. WORKFLOW
# ─────────────────────────────────────────────────────────────────────────────
def build_workflow(styles):
    els = []
    section_box(els, "4. Workflow", styles, color=PURPLE)

    # 4a. Auth Flow
    els.append(Paragraph("4.1  Authentication Flow", styles["sub_heading"]))
    els.append(Paragraph(
        "User submits credentials → Backend validates via bcrypt → JWT token issued → "
        "Token stored in sessionStorage → All API requests auto-attach token via Axios interceptor → "
        "Backend decodes token and enforces role on every request.",
        styles["body"]
    ))

    auth_flow = [
        ["Step", "Action", "Result"],
        ["1", "POST /auth/login", "Credentials validated"],
        ["2", "JWT Generated", "access_token returned (8h expiry)"],
        ["3", "Token Stored", "sessionStorage in browser"],
        ["4", "API Request", "Authorization: Bearer <token> attached"],
        ["5", "Role Check", "RBAC enforced — 403 if unauthorized"],
    ]
    els.append(colored_table(auth_flow, [2*cm, 5*cm, 8*cm]))
    els.append(Spacer(1, 0.3*cm))

    # 4b. Shipment lifecycle
    els.append(Paragraph("4.2  Shipment Dispatch Lifecycle", styles["sub_heading"]))

    lifecycle_data = [
        ["Status", "Triggered By", "Side Effects"],
        ["pending", "Dispatcher creates shipment", "Shipment record created"],
        ["in_transit", "Dispatcher assigns driver + vehicle", "Driver → unavailable, Vehicle → in_transit, Trip created"],
        ["delivered", "Driver marks delivery complete", "Driver → available, Vehicle → available, delivered_at set"],
        ["cancelled", "Dispatcher cancels shipment", "Resources freed, status final"],
    ]
    els.append(colored_table(lifecycle_data, [2.5*cm, 5*cm, 7.5*cm]))
    els.append(Spacer(1, 0.15*cm))
    els.append(Paragraph(
        "State flow:  pending  →  in_transit  →  delivered  |  cancelled",
        styles["caption"]
    ))
    els.append(Spacer(1, 0.3*cm))

    # 4c. GPS Tracking
    els.append(Paragraph("4.3  Real-Time GPS Tracking", styles["sub_heading"]))
    els.append(Paragraph(
        "A background simulation thread starts on server startup and updates each vehicle's "
        "lat/lng every 2 seconds. Updates are broadcast via WebSocket to all connected clients (LiveMap page). "
        "Drivers can also push manual location updates via <b>PATCH /gps/vehicles/{id}/location</b>.",
        styles["body"]
    ))

    # 4d. Maintenance & Alerts
    els.append(Paragraph("4.4  Maintenance &amp; Alert Workflow", styles["sub_heading"]))
    els.append(Paragraph(
        "Fleet managers schedule maintenance records per vehicle. Celery Beat periodically scans "
        "records and auto-generates alerts for: overdue services, health scores below threshold, and upcoming "
        "scheduled services. Alerts appear in the dashboard for acknowledgment and resolution.",
        styles["body"]
    ))

    # 4e. Reports
    els.append(Paragraph("4.5  Report Export Workflow", styles["sub_heading"]))
    report_data = [
        ["Report Type", "Formats", "Access"],
        ["Fleet Summary", "PDF, Excel", "Admin, Fleet Manager"],
        ["Driver Performance", "PDF, Excel", "Admin, Fleet Manager, Dispatcher"],
        ["Fuel Consumption", "PDF, Excel", "Admin, Fleet Manager"],
        ["Maintenance History", "PDF, Excel", "Admin, Fleet Manager"],
        ["Shipment / Delivery", "PDF, Excel", "Admin, Dispatcher"],
    ]
    els.append(colored_table(report_data, [5.5*cm, 3.5*cm, 6*cm]))
    return els


# ─────────────────────────────────────────────────────────────────────────────
# 5. SCREENSHOTS / UI OVERVIEW
# ─────────────────────────────────────────────────────────────────────────────
def draw_mockup_login(x, y, w, h, canvas):
    """Draw a Login page mockup"""
    # Card
    canvas.setFillColor(CARD_BG); canvas.setStrokeColor(BORDER)
    canvas.roundRect(x + w*0.15, y + h*0.05, w*0.7, h*0.88, 8, fill=1, stroke=1)
    # Title bar
    canvas.setFillColor(BLUE_DARK)
    canvas.roundRect(x + w*0.15, y + h*0.05, w*0.7, h*0.2, 8, fill=1, stroke=0)
    canvas.setFont("Helvetica-Bold", 7); canvas.setFillColor(WHITE)
    canvas.drawCentredString(x + w*0.5, y + h*0.13, "FleetFlow Login")
    # Fields
    for fy in [0.60, 0.42]:
        canvas.setFillColor(NAVY); canvas.setStrokeColor(BORDER)
        canvas.roundRect(x + w*0.2, y + h*fy, w*0.6, h*0.11, 4, fill=1, stroke=1)
    canvas.setFont("Helvetica", 5); canvas.setFillColor(TEXT_SEC)
    canvas.drawString(x + w*0.22, y + h*0.68, "Email")
    canvas.drawString(x + w*0.22, y + h*0.50, "Password")
    # Button
    canvas.setFillColor(BLUE_DARK)
    canvas.roundRect(x + w*0.25, y + h*0.17, w*0.5, h*0.12, 4, fill=1, stroke=0)
    canvas.setFont("Helvetica-Bold", 5); canvas.setFillColor(WHITE)
    canvas.drawCentredString(x + w*0.5, y + h*0.22, "Login")


def draw_mockup_dashboard(x, y, w, h, canvas):
    """Draw a Dashboard mockup"""
    # Sidebar
    canvas.setFillColor(NAVY); canvas.rect(x, y, w*0.22, h, fill=1, stroke=0)
    canvas.setFillColor(BLUE)
    canvas.roundRect(x+2, y + h*0.88, w*0.18, h*0.07, 3, fill=1, stroke=0)
    canvas.setFont("Helvetica", 5); canvas.setFillColor(TEXT_SEC)
    for i, label in enumerate(["Dashboard","Vehicles","Drivers","Shipments","Live Map"]):
        canvas.drawString(x+6, y + h*(0.77 - i*0.12), label)
    # Main area
    # Stat cards row 1
    card_colors = [BLUE_DARK, colors.HexColor("#166534"), colors.HexColor("#92400e")]
    for ci, cc in enumerate(card_colors):
        cx = x + w*0.25 + ci*(w*0.24)
        canvas.setFillColor(cc)
        canvas.roundRect(cx, y + h*0.68, w*0.22, h*0.26, 4, fill=1, stroke=0)
        canvas.setFont("Helvetica-Bold", 12); canvas.setFillColor(WHITE)
        canvas.drawCentredString(cx + w*0.11, y + h*0.82, str([25, 18, 8][ci]))
        canvas.setFont("Helvetica", 4.5); canvas.setFillColor(TEXT_SEC)
        canvas.drawCentredString(cx + w*0.11, y + h*0.72, ["Total Vehicles","Active","Pending"][ci])
    # Stat cards row 2
    card2 = [colors.HexColor("#1e3a5f"), colors.HexColor("#3b1f6e"), colors.HexColor("#7f1d1d")]
    for ci, cc in enumerate(card2):
        cx = x + w*0.25 + ci*(w*0.24)
        canvas.setFillColor(cc)
        canvas.roundRect(cx, y + h*0.35, w*0.22, h*0.26, 4, fill=1, stroke=0)
        canvas.setFont("Helvetica-Bold", 12); canvas.setFillColor(WHITE)
        canvas.drawCentredString(cx + w*0.11, y + h*0.49, str([12, 125, 4][ci]))
        canvas.setFont("Helvetica", 4.5); canvas.setFillColor(TEXT_SEC)
        canvas.drawCentredString(cx + w*0.11, y + h*0.39, ["Avail Drivers","Delivered","Alerts"][ci])


def draw_mockup_livemap(x, y, w, h, canvas):
    """Draw a Live Map mockup"""
    # Sidebar
    canvas.setFillColor(NAVY); canvas.rect(x, y, w*0.22, h, fill=1, stroke=0)
    canvas.setFont("Helvetica-Bold", 5); canvas.setFillColor(BLUE)
    canvas.drawString(x+4, y+h*0.92, "Live Map")
    canvas.setFont("Helvetica", 4); canvas.setFillColor(TEXT_SEC)
    canvas.drawString(x+4, y+h*0.85, "● KL-01-AB-1234  In Transit")
    canvas.drawString(x+4, y+h*0.79, "● KL-02-CD-5678  Available")
    canvas.drawString(x+4, y+h*0.73, "● KL-03-EF-9012  Maintenance")
    # Map area
    canvas.setFillColor(colors.HexColor("#0c2340"))
    canvas.rect(x + w*0.23, y, w*0.77, h, fill=1, stroke=0)
    # Grid lines
    canvas.setStrokeColor(colors.HexColor("#1a3a5c")); canvas.setLineWidth(0.3)
    for i in range(5):
        gx = x + w*0.23 + i*(w*0.15)
        canvas.line(gx, y, gx, y+h)
        gy = y + i*(h*0.2)
        canvas.line(x+w*0.23, gy, x+w, gy)
    # Vehicle markers
    markers = [(0.45,0.6,GREEN,"In Transit"),(0.6,0.4,BLUE,"Available"),(0.8,0.7,RED,"Maintenance")]
    for mx, my, mc, lbl in markers:
        px, py = x + w*mx, y + h*my
        canvas.setFillColor(mc); canvas.circle(px, py, 5, fill=1, stroke=0)
        canvas.setFillColor(WHITE); canvas.setFont("Helvetica-Bold", 4)
        canvas.drawCentredString(px, py-1.5, "V")
        canvas.setFillColor(CARD_BG); canvas.setStrokeColor(mc)
        canvas.roundRect(px-15, py+7, 30, 8, 2, fill=1, stroke=1)
        canvas.setFont("Helvetica", 3.5); canvas.setFillColor(WHITE)
        canvas.drawCentredString(px, py+9.5, lbl)


def draw_mockup_maintenance(x, y, w, h, canvas):
    """Draw Maintenance mockup"""
    canvas.setFillColor(NAVY); canvas.rect(x, y, w*0.22, h, fill=1, stroke=0)
    canvas.setFont("Helvetica-Bold", 5); canvas.setFillColor(BLUE)
    canvas.drawString(x+4, y+h*0.92, "Maintenance")
    # Table header
    canvas.setFillColor(colors.HexColor("#92400e"))
    canvas.rect(x+w*0.23, y+h*0.78, w*0.77, h*0.14, fill=1, stroke=0)
    canvas.setFont("Helvetica-Bold", 4.5); canvas.setFillColor(WHITE)
    for ci, col in enumerate(["Vehicle","Category","Status","Health","Cost"]):
        canvas.drawString(x+w*(0.25+ci*0.15), y+h*0.83, col)
    # Rows
    rows = [
        ("KL-01","Oil Change","Completed","92","₹2500",GREEN),
        ("KL-02","Brake Svc","In Progress","65",  "₹8000",AMBER),
        ("KL-03","Engine","Scheduled","40",  "₹15000",RED),
        ("KL-04","Tyre Repl","Completed","88","₹5000",GREEN),
    ]
    for ri, (v,c,s,h_score,cost,sc) in enumerate(rows):
        ry = y+h*(0.63 - ri*0.14)
        bg = CARD_BG if ri%2==0 else NAVY
        canvas.setFillColor(bg); canvas.rect(x+w*0.23, ry, w*0.77, h*0.12, fill=1, stroke=0)
        canvas.setFont("Helvetica", 4); canvas.setFillColor(TEXT_PRI)
        for ci2, val in enumerate([v,c,s,h_score,cost]):
            canvas.drawString(x+w*(0.25+ci2*0.15), ry+h*0.04, val)
        # Status color
        canvas.setFillColor(sc)
        canvas.roundRect(x+w*0.51, ry+h*0.02, w*0.12, h*0.07, 2, fill=1, stroke=0)
        canvas.setFont("Helvetica-Bold", 3.5); canvas.setFillColor(DARK_BG)
        canvas.drawCentredString(x+w*0.57, ry+h*0.05, s)


def build_screenshots(styles):
    els = []
    section_box(els, "5. Screenshots & UI Overview", styles, color=AMBER)

    els.append(Paragraph(
        "FleetFlow features a dark-themed, role-adaptive web UI with 14 screens. "
        "Below are representative mockups of the key interface pages.",
        styles["body"]
    ))
    els.append(Spacer(1, 0.3*cm))

    # Pages summary table
    pages_data = [
        ["Screen", "Component", "Access", "Key Features"],
        ["Login", "Login.jsx", "Public", "JWT auth, role-based redirect"],
        ["Dashboard", "Dashboard.jsx", "All roles", "7 live KPI stat cards"],
        ["Live Map", "LiveMap.jsx", "Admin/FM/Disp", "WebSocket GPS tracking, markers"],
        ["Vehicles", "Vehicles.jsx", "Admin/FM", "CRUD table, GPS coordinates"],
        ["Drivers", "Drivers.jsx", "Admin/FM/Disp", "Performance metrics, attendance"],
        ["Driver Assignment", "DriverAssignment.jsx", "Admin/Disp", "Conflict-free assignment"],
        ["Shipments", "Shipments.jsx", "Admin/Disp/Driver", "Status lifecycle, cancel"],
        ["Maintenance", "Maintenance.jsx", "Admin/FM", "Health score, scheduling"],
        ["Maintenance Alerts", "MaintenanceAlerts.jsx", "Admin/FM", "Auto-alerts, acknowledge"],
        ["Fuel", "Fuel.jsx", "Admin/FM/Driver", "Fuel logs, cost analytics"],
        ["Notifications", "Notifications.jsx", "All roles", "Priority inbox, multi-channel"],
        ["Reports", "ReportsExport.jsx", "Admin/FM/Disp", "PDF & Excel downloads"],
        ["Trips", "Trips.jsx", "Admin/FM/Disp", "Trip tracking & history"],
    ]
    els.append(colored_table(pages_data, [2.8*cm, 3.8*cm, 3.0*cm, 5.4*cm], header_bg=colors.HexColor("#92400e")))

    return els


def build_ui_mockups_page(styles):
    """Returns a list of (drawing_fn, caption) for inline mockup drawings"""
    # We'll put 4 mockups in a 2x2 grid using a Table of drawings
    return []  # handled separately as canvas operations in the flow


# ─────────────────────────────────────────────────────────────────────────────
# 6. CONCLUSION
# ─────────────────────────────────────────────────────────────────────────────
def build_conclusion(styles):
    els = []
    section_box(els, "6. Conclusion", styles, color=TEAL)

    els.append(Paragraph(
        "<b>FleetFlow</b> successfully delivers a production-ready, end-to-end fleet management solution "
        "that consolidates all logistics operations into a single, intelligent platform. "
        "The system eliminates manual processes, provides real-time visibility, and empowers each "
        "stakeholder role with precisely the tools they need.",
        styles["body"]
    ))
    els.append(Spacer(1, 0.2*cm))

    # Achievements table
    els.append(Paragraph("Key Achievements", styles["sub_heading"]))
    ach_data = [
        ["Metric", "Value"],
        ["API Endpoints", "70+ REST endpoints + 2 WebSocket channels"],
        ["Database Tables", "10 normalized PostgreSQL tables"],
        ["Frontend Screens", "14 role-adaptive React pages"],
        ["Docker Services", "6 containers (PostgreSQL, Redis, Backend, Celery ×2, Frontend)"],
        ["Report Formats", "PDF (ReportLab) + Excel (OpenPyXL) for 5 report types"],
        ["Background Tasks", "Celery Beat for scheduled maintenance alerts"],
        ["Security", "JWT RBAC with 4 roles, bcrypt passwords, session-scoped tokens"],
    ]
    els.append(colored_table(ach_data, [5*cm, 10*cm], header_bg=colors.HexColor("#134e4a")))
    els.append(Spacer(1, 0.3*cm))

    # Challenges
    els.append(Paragraph("Challenges &amp; Solutions", styles["sub_heading"]))
    ch_data = [
        ["Challenge", "Solution Applied"],
        ["bcrypt/passlib compatibility", "Used bcrypt library directly, bypassing passlib"],
        ["Real-time GPS without hardware", "Background simulation thread broadcasting via WebSocket"],
        ["N+1 query performance", "SQLAlchemy aggregate functions (func.sum, func.count)"],
        ["Role-scoped data access", "RBAC dependency injection — enforced at middleware layer"],
    ]
    els.append(colored_table(ch_data, [6.5*cm, 8.5*cm], header_bg=colors.HexColor("#1e3a5f")))
    els.append(Spacer(1, 0.3*cm))

    # Future scope
    els.append(Paragraph("Future Enhancements", styles["sub_heading"]))
    future = [
        "Google Maps integration for real geocoding and route visualization",
        "Email/SMS notification delivery via SendGrid / Twilio",
        "React Native mobile app for on-the-go driver tracking",
        "AI-powered route optimization and predictive maintenance",
        "Customer shipment tracking portal with public links",
        "Multi-tenant support for multiple fleet organizations",
    ]
    for item in future:
        els.append(Paragraph(f"▸  {item}", styles["bullet"]))

    els.append(Spacer(1, 0.5*cm))
    els.append(hr(color=BLUE, thickness=1))
    els.append(Spacer(1, 0.2*cm))
    els.append(Paragraph(
        '"FleetFlow transforms fragmented fleet data into real-time operational intelligence,<br/>'
        'empowering logistics teams to move faster, smarter, and safer."',
        ParagraphStyle("quote", fontName="Helvetica-Oblique", fontSize=9.5,
                       textColor=BLUE, alignment=TA_CENTER, leading=15)
    ))
    els.append(Spacer(1, 0.2*cm))
    els.append(Paragraph(
        "FleetFlow v1.0 | Infosys Internship Project | 2026",
        styles["footer"]
    ))

    return els


# ─────────────────────────────────────────────────────────────────────────────
# CANVAS-DRAWN MOCKUPS FLOWABLE
# ─────────────────────────────────────────────────────────────────────────────
from reportlab.platypus import Flowable

class MockupGrid(Flowable):
    """2×2 grid of UI mockups drawn on canvas"""
    def __init__(self, width, height):
        super().__init__()
        self.width = width
        self.height = height

    def draw(self):
        c = self.canv
        w, h = self.width, self.height
        pad = 8
        mw = (w - 3*pad) / 2
        mh = (h - 3*pad) / 2

        positions = [
            (pad,           mh + 2*pad, draw_mockup_login,       "Fig 1: Login Page"),
            (mw + 2*pad,    mh + 2*pad, draw_mockup_dashboard,   "Fig 2: Dashboard"),
            (pad,           pad,        draw_mockup_livemap,     "Fig 3: Live Map (GPS)"),
            (mw + 2*pad,    pad,        draw_mockup_maintenance, "Fig 4: Maintenance"),
        ]

        for (bx, by, draw_fn, caption) in positions:
            # Panel background
            c.setFillColor(CARD_BG); c.setStrokeColor(BORDER)
            c.roundRect(bx, by, mw, mh, 6, fill=1, stroke=1)
            # Draw the mockup
            draw_fn(bx, by, mw, mh, c)
            # Caption
            c.setFont("Helvetica-Oblique", 5.5)
            c.setFillColor(TEXT_SEC)
            c.drawCentredString(bx + mw/2, by - 10, caption)

    def wrap(self, aW, aH):
        return self.width, self.height


# ─────────────────────────────────────────────────────────────────────────────
# MAIN BUILDER
# ─────────────────────────────────────────────────────────────────────────────
def build_pdf():
    doc = SimpleDocTemplate(
        OUTPUT_FILE,
        pagesize=A4,
        leftMargin=1.8*cm,
        rightMargin=1.8*cm,
        topMargin=1.5*cm,
        bottomMargin=1.5*cm,
        title="FleetFlow — Project Documentation",
        author="Infosys Internship",
        subject="Fleet Management & Logistics Tracking Platform",
    )

    styles = build_styles()
    story = []

    # ── Cover ──
    story.extend(build_cover(styles))

    # ── Sections ──
    story.extend(build_introduction(styles))
    story.append(Spacer(1, 0.4*cm))

    story.extend(build_problem_statement(styles))
    story.append(Spacer(1, 0.4*cm))

    story.extend(build_objectives(styles))
    story.append(Spacer(1, 0.4*cm))

    story.extend(build_workflow(styles))
    story.append(PageBreak())

    # Screenshots section
    story.extend(build_screenshots(styles))
    story.append(Spacer(1, 0.4*cm))

    # Mockup grid
    usable_w = PAGE_W - 3.6*cm
    story.append(MockupGrid(usable_w, 10*cm))
    story.append(Spacer(1, 0.6*cm))

    story.extend(build_conclusion(styles))

    # ── Build ──
    def page_bg(canvas, doc):
        if doc.page == 1:
            draw_cover_background(canvas, doc)
        else:
            draw_page_background(canvas, doc)

    doc.build(story, onFirstPage=page_bg, onLaterPages=page_bg)
    print(f"\nPDF generated successfully!\nSaved to: {OUTPUT_FILE}\n")


if __name__ == "__main__":
    build_pdf()
