from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.lib.colors import black, HexColor

OUT=Path(__file__).resolve().parents[1]
W,H=letter
M=0.65*72
RIGHT=W-M
LEFT=M
RULE=HexColor("#666666")
FONT="Helvetica"
BOLD="Helvetica-Bold"
ITALIC="Helvetica-Oblique"
BODY=10.5

def wrap(text,font,size,width):
    words=text.split()
    lines=[]; cur=""
    for word in words:
        cand=(cur+" "+word).strip()
        if stringWidth(cand,font,size)<=width or not cur:
            cur=cand
        else:
            lines.append(cur); cur=word
    if cur: lines.append(cur)
    return lines

class Writer:
    def __init__(self,path,title,subtitle):
        self.c=canvas.Canvas(str(path),pagesize=letter,pageCompression=1)
        self.c.setTitle(title); self.c.setAuthor("Atharva Barad")
        self.subtitle=subtitle; self.y=H-M; self.page=1
        self.header(True)
    def header(self,first=False):
        if first:
            self.c.setFont(BOLD,18); self.c.drawCentredString(W/2,self.y,"Atharva Barad"); self.y-=18
            self.c.setFont(FONT,9.5); self.c.drawCentredString(W/2,self.y,"Seattle Metropolitan Area | 425-749-7338 | atharvambarad@gmail.com | linkedin.com/in/atharvambarad"); self.y-=16
            self.c.setFont(BOLD,9.5); self.c.setFillColor(HexColor("#333333")); self.c.drawCentredString(W/2,self.y,self.subtitle); self.c.setFillColor(black); self.y-=12
        else:
            self.c.setFont(BOLD,9); self.c.setFillColor(HexColor("#444444")); self.c.drawString(LEFT,self.y,"ATHARVA BARAD")
            self.c.setFont(FONT,9); self.c.drawRightString(RIGHT,self.y,f"PAGE {self.page}"); self.c.setFillColor(black); self.y-=16
    def new_page(self):
        self.c.showPage(); self.page+=1; self.y=H-M; self.header(False)
    def section(self,title,before=5):
        self.y-=before
        self.c.setFont(BOLD,10.5); self.c.drawString(LEFT,self.y,title.upper()); self.y-=3
        self.c.setStrokeColor(RULE); self.c.setLineWidth(.5); self.c.line(LEFT,self.y,RIGHT,self.y); self.c.setStrokeColor(black); self.y-=10
    def twocol(self,left,right="",left_font=BOLD,left_size=10.5,right_size=9.8,after=0):
        self.c.setFont(left_font,left_size); self.c.drawString(LEFT,self.y,left)
        if right:
            self.c.setFont(FONT,right_size); self.c.drawRightString(RIGHT,self.y,right)
        self.y-=left_size+2+after
    def role(self,left,right=""):
        self.c.setFont(ITALIC,10); self.c.drawString(LEFT,self.y,left)
        if right:
            self.c.setFont(FONT,9.8); self.c.drawRightString(RIGHT,self.y,right)
        self.y-=12
    def bullet(self,text,after=1):
        bullet_x=LEFT+4; text_x=LEFT+15
        lines=wrap(text,FONT,BODY,RIGHT-text_x)
        self.c.setFont(FONT,BODY); self.c.drawString(bullet_x,self.y,chr(8226))
        for line in lines:
            self.c.drawString(text_x,self.y,line); self.y-=12
        self.y-=after
    def label(self,label,text,after=1):
        self.c.setFont(BOLD,10.2); self.c.drawString(LEFT,self.y,label)
        x=LEFT+stringWidth(label,BOLD,10.2)
        lines=wrap(text,FONT,10.2,RIGHT-x)
        self.c.setFont(FONT,10.2)
        if lines:
            self.c.drawString(x,self.y,lines[0]); self.y-=11.5
            for line in lines[1:]:
                self.c.drawString(LEFT,self.y,line); self.y-=11.5
        self.y-=after
    def para(self,text,size=10.2,after=1):
        for line in wrap(text,FONT,size,RIGHT-LEFT):
            self.c.setFont(FONT,size); self.c.drawString(LEFT,self.y,line); self.y-=size+1.3
        self.y-=after
    def finish(self):
        self.c.save()

def education(w):
    w.section("Education",0)
    w.twocol("University of Washington Bothell","Bothell, WA")
    w.role("Bachelor of Arts in Business Administration | GPA 3.64/4.00","Aug 2026")
    w.para("Academic focus: Finance and Management Information Systems | Annual Dean's List 2024-2025",10.2,1)

def build_core():
    w=Writer(OUT/"Atharva_Barad_Resume.pdf","Atharva Barad - Resume","Finance & MIS | Financial Modeling | Analytics | Business Systems | Consulting")
    education(w)
    w.section("Professional Experience")
    w.twocol("United Indians of All Tribes Foundation","Seattle, WA"); w.role("Garden Intern Supervisor","Nov 2023 - Nov 2025")
    for b in [
        "Rebuilt quarterly volunteer reporting from paper logs into digital forms and an Excel workflow using Power Query, PivotTables, VBA/macros, validation, and error flags, cutting end-to-end preparation from roughly 4-8 hours to about 40 minutes",
        "Developed the proposal and budget for an awarded $73,000 King County WaterWorks grant; after award, tracked spending, coordinated purchases with accounting/management, and prepared 8 quarterly compliance reports across overlapping grant cycles",
        "Increased volunteer participation by approximately 70% year over year through targeted outreach, consistent communication, and partnerships with local organizations"]:
        w.bullet(b)
    w.section("Consulting & Leadership")
    w.twocol("Business Consulting Association, UW Bothell","Bothell, WA"); w.role("Student Consultant / Case Competition Team Lead","Sep 2025 - Jun 2026")
    for b in [
        'Advised Sky Rivers Advisory through competitor, client, pricing, and marketing research; translated findings into recommendations and performed final deliverable QA on work the client described as "five-star"',
        "Led a Major League Volleyball case team developing a 10-year media-led growth roadmap around a $20 million capital opportunity and threefold valuation target, consolidating market research, strategic options, and final presentation materials"]:
        w.bullet(b)
    w.section("Selected Projects")
    w.twocol("Monte Carlo International Expansion Research","Summer 2026"); w.role("B BUS 499 Independent Study | Python / Monte Carlo")
    for b in [
        "Built a Python Monte Carlo decision-support model for a 15-year, six-warehouse international-expansion strategy, evaluating 12 scenarios across 10,000 paths each and 23 stochastic country variables",
        "Translated country risk into correlated financial drivers for FX/inflation, delays, working capital, financing, and WACC; validated 157 archived core/FX/financing checks plus reproduction of all 12 scenarios"]:
        w.bullet(b)
    w.twocol("Costco Five-Warehouse Capital Budgeting","Summer 2026"); w.role("B BUS 451 Team Project | Primary Analytical Lead")
    for b in [
        "Led most research and modeling for a five-warehouse cash-flow model covering revenue, cannibalization, OpEx, CapEx, depreciation, working capital, taxes, and salvage",
        "Evaluated $128.91 million initial investment at $140.96 million NPV and 25.58% IRR using an 8.18% WACC; scenario NPVs ranged $3.99 million-$326.13 million; recommended internal financing"]:
        w.bullet(b)
    w.twocol("UniPath Student Lifecycle Platform","Mar 2026 - Jun 2026"); w.role("B BUS 489 Five-Person MIS Capstone | PostgreSQL / Python")
    for b in [
        "Designed a normalized 34-table PostgreSQL schema/ERD with UUID keys, foreign keys, and junction tables spanning university search, applications, academic progress, and alumni outcomes",
        "Built the Python proof of concept for multidimensional ranking, semantic matching, calibrated admission estimates, and early-warning academic-risk workflows using synthetic/prepared data"]:
        w.bullet(b)
    w.section("Skills & Credentials")
    w.label("Finance & Analytics: ","DCF/FCFF, DDM, P/E, NPV/IRR, WACC, Monte Carlo | Excel (PivotTables, Power Query, VBA), Python, SQL/PostgreSQL")
    w.label("Systems & Credentials: ","Data modeling, requirements/workflows, testing/QA, Tableau; Power BI (working) | BMC | LinkedIn Learning Business Analysis",0)
    if w.y < M-2:
        raise RuntimeError(f"Core resume overflow: {w.y}")
    w.finish()

def project(w,title,date,context,bullets):
    w.twocol(title,date); w.role(context)
    for b in bullets: w.bullet(b)

def build_extended():
    w=Writer(OUT/"Atharva_Barad_Extended_Profile.pdf","Atharva Barad - Extended Professional Profile","Extended Professional Profile | Evidence-oriented companion to the one-page resume")
    education(w)
    w.section("Credentials")
    w.label("Completed: ","Bloomberg Market Concepts (BMC); Business Analysis Techniques for Business Transformation - LinkedIn Learning, Jan 2026")
    w.label("Additional: ","Adult Mental Health First Aid, 2nd Edition (Sep 2024-Sep 2027); Adult/Child/Infant CPR, AED & First Aid - HSI (through Dec 2026)",0)
    w.section("Professional Experience")
    w.twocol("United Indians of All Tribes Foundation","Seattle, WA"); w.role("Garden Intern Supervisor","Nov 2023 - Nov 2025")
    for b in [
        "Rebuilt quarterly volunteer reporting from paper logs into digital forms and an Excel workflow using Power Query, PivotTables, VBA/macros, validation, and error flags, cutting end-to-end preparation from roughly 4-8 hours to about 40 minutes",
        "Developed the proposal and budget for an awarded $73,000 King County WaterWorks grant; after award, tracked spending, coordinated purchases with accounting/management, and prepared 8 quarterly compliance reports across overlapping grant cycles",
        "Increased volunteer participation by approximately 70% year over year through targeted outreach, consistent communication, and partnerships with local organizations",
        "Designed and led a 6-week horticulture and water-systems internship for 8 interns using structured learning plans, weekly check-ins, individualized feedback, and performance metrics"]:
        w.bullet(b)
    w.twocol("N&M Events","Kent, WA"); w.role("Event Staff / Operations Support | On-call family business","Jun 2023 - Present")
    for b in [
        "Supported 50+ private, cultural, and corporate events for roughly 10-200 attendees, coordinating decor, venue setup/layouts, equipment, transportation, inventory, and day-of adjustments",
        "Translated changing client and family-operator requests into setup and logistics decisions during live events, adapting execution as requirements shifted"]:
        w.bullet(b)

    w.new_page(); w.section("Professional Experience (continued)",0)
    w.twocol("Chipotle Mexican Grill","Kent, WA"); w.role("Crew Member","Sep 2022 - Jan 2024")
    w.bullet("Served 100+ customers on typical busy shifts while maintaining food quality, order accuracy, cleanliness, and rush-period workflow")
    w.twocol("Bellevue Urban Garden","Bellevue, WA"); w.role("Garden Team Lead | Unpaid internship/volunteer","Feb 2021 - Mar 2022")
    w.bullet("Supported garden operations, landscaping/path work, waste management, seed collection, and team-lead responsibilities; title is based on recollection")
    w.section("Consulting & Leadership")
    w.twocol("Business Consulting Association, UW Bothell","Bothell, WA"); w.role("Student Consultant / Case Competition Team Lead","Sep 2025 - Jun 2026")
    for b in [
        "Completed 2 client engagements and 3 case competitions spanning market research, analysis, solution development, presentation work, and final-deliverable quality control",
        'Advised Sky Rivers Advisory through competitor, client, pricing, and marketing research; translated findings into recommendations and performed substantial final QA on deliverables the client described as "five-star"',
        "Conducted interviews plus local-community, historical, online-forum, and social-sentiment research for a regional credit-union client, converting findings into recommendations on partnerships, programming, and space use",
        "Led a Major League Volleyball case team developing a 10-year media-led growth roadmap around a $20 million capital opportunity and threefold valuation target; consolidated research/data and built final presentation materials",
        "Led an ad hoc soybean-export case team after original teammates withdrew, delegated workstreams by strengths, analyzed target markets, and synthesized trade, finance, marketing, and contract research",
        "Took analytical initiative under another formal lead on a CIT airline strategy case comparing carrier positioning and market options including Vietnam, Singapore, and Indonesia"]:
        w.bullet(b)

    w.new_page(); w.section("Independent Research & Finance Projects",0)
    project(w,"Monte Carlo International Expansion Research","Jun - Aug 2026","B BUS 499 Independent Study | Python / Monte Carlo | Grade 4.0",[
        "Built a Python Monte Carlo decision-support model for a 15-year, six-warehouse international-expansion strategy, evaluating 12 scenarios across 10,000 paths each and 23 stochastic country variables",
        "Mapped country-level benefits, costs, and risks into correlated financial assumptions through a 23-by-23 dependence matrix, incorporating FX/inflation, construction delays, working capital, financing constraints, and dynamic WACC while keeping a separate 21-by-21 AHP strategic framework",
        "Structured outputs around distribution-based scenario comparison rather than single-point forecasts and validated 157 archived core/FX/financing checks plus reproduction of all 12 scenarios"])
    project(w,"Costco Five-Warehouse Capital Budgeting","Summer 2026","B BUS 451 Team Project | Primary Analytical Lead | Grade 4.0",[
        "Led most research and modeling for a five-warehouse cash-flow model covering revenue, cannibalization, OpEx, CapEx, depreciation, working capital, taxes, and salvage",
        "Evaluated a modeled $128.91 million initial investment at $140.96 million NPV and 25.58% IRR using an 8.18% WACC; scenario NPVs ranged from $3.99 million to $326.13 million",
        "Recommended 100% internal financing after assessing liquidity, cash generation, and payout flexibility"])
    project(w,"Apple Fundamental Analysis & Equity Valuation","Summer 2026","B BUS 454 Team Project | Part 3 Valuation / QA Lead | Grade 4.0",[
        "Led FCFF DCF, dividend-discount, and peer P/E valuation work; final submitted values were $174.76/share, $22.03, and $140.55, with 9.01% WACC and 3.0% terminal growth in the FCFF case",
        "Reconciled citations, source data, and output inconsistencies across the team deliverable, corrected a mismatched section, and standardized final report/presentation figures"])

    w.new_page(); w.section("Strategy, International & MIS Projects",0)
    project(w,"Costco Singapore Market Entry","Mar - Jun 2026","B BUS 480 Team Project | Country Screening / Financial Research / QA | Grade 4.0",[
        "Spearheaded the country-screening tool by structuring the model, researching inputs, helping define criteria, and validating data/scoring; the team ranked Singapore 7.50 versus 6.25 for South Korea and 5.35 for Japan",
        "Conducted pricing and financial research and performed cross-module QA, correcting statistics, assumptions/settings, appendix issues, and final formatting across the business plan"])
    project(w,"WEBTOON Strategic Management Capstone","Summer 2026","B BUS 470 Four-Person Team Project | Strategy / Deliverable QA | Grade 4.0",[
        "Owned assigned analysis covering organizational structure, Five Forces, competitor/Blue Ocean/CSR, company timeline, intra-firm value chain, and TMT/board matrix; presented slides 4-6",
        "Reconciled citations, formatting, background consistency, and cross-section issues across the final deck to improve coherence and presentation quality"])
    project(w,"UniPath Student Lifecycle Platform","Mar - Jun 2026","B BUS 489 Five-Person MIS Capstone | PostgreSQL / Python | Grade 3.9",[
        "Designed a normalized 34-table PostgreSQL schema/ERD with UUID primary keys, explicit foreign keys, and junction relationships spanning university search, applications, academic progress, and alumni outcomes",
        "Built the Python proof of concept for multidimensional ranking, semantic matching, calibrated admission estimates, and early-warning academic-risk workflows using synthetic/prepared data",
        "Co-developed the broader six-layer architecture and API/data-flow concepts with a five-person team, integrating the schema and Python POC into the shared system design"])
    project(w,"Visionaire Smart Glasses","Sep - Dec 2025","B BUS 330 Four-Person Team Project | Early-stage Product Economics",[
        "Focused on pricing/financing, startup costs, revenue/expense projections, and break-even for an industrial AR smart-glasses concept; retained as early-stage product/finance evidence rather than advanced valuation work"])

    w.new_page(); w.section("Personal Technical & Software Projects",0)
    project(w,"System (formerly MasterBase)","Aug 2026 - Present","Personal Product / Software Project | Kotlin Multiplatform / SQLDelight / Supabase",[
        "Define product requirements, UI/design flows, analytics rules, offline/sync semantics, scope decisions, and acceptance criteria for a Kotlin Multiplatform Android/Desktop application",
        "Designed local-first behavior around stable record IDs, pending mutations, conflict handling, and separate local/remote/historical representations; read and modify Kotlin and SQL directly",
        "Field-test Android/Desktop behavior and built a GitHub-backed multi-worker relay workflow to coordinate AI-assisted implementation, debugging, audits, and regression validation"])
    project(w,"CommuteWise","2026","CSS 360 Software Engineering Team Project | FastAPI / Map APIs",[
        "Contributed product/feature ideation, requirements consolidation, integration review, manual/user testing, bug identification, and release validation for a map-based commute-analysis application; another teammate drove much of the implementation"])
    project(w,"CSS 475 Database Systems","2026","PostgreSQL / SQL Coursework and Team Database/API Work",[
        "Built and tested PostgreSQL/SQL functionality using schemas/ERDs, parameterized queries, joins, reads/writes, validation, Python-backed database APIs, transactions, and optimization concepts"])
    w.section("Additional Service & Evidence")
    w.twocol("Seattle Maharashtra Mandal","Redmond, WA"); w.role("Student Events Volunteer","Feb 2020 - Mar 2023")
    w.bullet("Supported cultural/community events for 200+ attendees, including indoor/outdoor layouts, setup, attendee supervision, and event flow")
    w.label("Data visualization: ","Academic Tableau project with public profile; Power BI working knowledge only")
    w.section("Skills")
    w.label("Finance & Analysis: ","DCF/FCFF, DDM, P/E/comps, NPV/IRR, CAPM/WACC, capital budgeting, scenario/sensitivity, Monte Carlo, pricing/break-even")
    w.label("Excel & Data: ","Formulas, PivotTables, Power Query, VBA/macros, validation, conditional formatting, filters/tables, lookups, charts, Python, pandas, NumPy, SQL/PostgreSQL, Tableau")
    w.label("Systems & Product: ","Kotlin/KMP, Compose Multiplatform, SQLDelight, Supabase/Postgres, relational modeling, APIs/data flow, offline/sync concepts, requirements, UI/UX, testing/regression, Git/GitHub")
    w.label("Business Delivery: ","Grant budgeting/compliance, process improvement, stakeholder coordination, student consulting, market/competitive research, program coordination, client presentations, deliverable QA",0)
    w.finish()

if __name__=="__main__":
    build_core()
    build_extended()
