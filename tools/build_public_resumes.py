from pathlib import Path
import re
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import black, HexColor

OUT=Path(__file__).resolve().parents[1]
W,H=letter
M=0.65*72
LEFT=M; RIGHT=W-M
PRINTABLE=H-2*M
BODY=10.5

REG_PATH='/usr/share/fonts/truetype/croscore/Arimo-Regular.ttf'
BOLD_PATH='/usr/share/fonts/truetype/croscore/Arimo-Bold.ttf'
ITALIC_PATH='/usr/share/fonts/truetype/croscore/Arimo-Italic.ttf'
pdfmetrics.registerFont(TTFont('Arial', REG_PATH))
pdfmetrics.registerFont(TTFont('Arial-Bold', BOLD_PATH))
pdfmetrics.registerFont(TTFont('Arial-Italic', ITALIC_PATH))
FONT='Arial'; BOLD='Arial-Bold'; ITALIC='Arial-Italic'
RULE=HexColor('#666666')


def parse_markup(text):
    parts=re.split(r'(\*\*.*?\*\*)', text)
    out=[]
    for p in parts:
        if not p: continue
        if p.startswith('**') and p.endswith('**'):
            out.append((p[2:-2], BOLD))
        else:
            out.append((p, FONT))
    return out


def rich_words(text):
    words=[]
    pending_space=False
    for seg,font in parse_markup(text):
        for part in re.findall(r'\s+|\S+', seg):
            if part.isspace():
                pending_space=True
                continue
            token=(' ' if pending_space and words else '')+part
            words.append((token,font))
            pending_space=False
    return words


def wrap_rich(text, size, width):
    lines=[]; cur=[]; curw=0
    for token,font in rich_words(text):
        tw=pdfmetrics.stringWidth(token,font,size)
        if cur and curw+tw>width:
            lines.append(cur); cur=[(token,font)]; curw=tw
        else:
            cur.append((token,font)); curw+=tw
    if cur: lines.append(cur)
    return lines

class Writer:
    def __init__(self,path,title,summary):
        self.path=Path(path); self.c=canvas.Canvas(str(path),pagesize=letter,pageCompression=1)
        self.c.setTitle(title); self.c.setAuthor('Atharva Barad')
        self.y=H-M
        self.c.setFont(BOLD,18); self.c.drawCentredString(W/2,self.y,'Atharva Barad'); self.y-=17
        self.c.setFont(FONT,9.5); self.c.drawCentredString(W/2,self.y,'Seattle Metropolitan Area | 425-749-7338 | atharvambarad@gmail.com | linkedin.com/in/atharvambarad'); self.y-=15
        self.draw_summary(summary)
    def draw_summary(self,text):
        lines=wrap_rich(text,10.2,RIGHT-LEFT)
        if len(lines)>2:
            raise RuntimeError(f'Summary >2 lines: {len(lines)}')
        for line in lines:
            x=LEFT
            for token,font in line:
                self.c.setFont(font,10.2); self.c.drawString(x,self.y,token); x+=pdfmetrics.stringWidth(token,font,10.2)
            self.y-=11.7
        self.y-=2
    def section(self,title,before=3):
        self.y-=before
        self.c.setFont(BOLD,10.5); self.c.drawString(LEFT,self.y,title.upper()); self.y-=3
        self.c.setStrokeColor(RULE); self.c.setLineWidth(.45); self.c.line(LEFT,self.y,RIGHT,self.y); self.c.setStrokeColor(black); self.y-=9
    def twocol(self,left,right='',after=0):
        self.c.setFont(BOLD,10.5); self.c.drawString(LEFT,self.y,left)
        if right:
            self.c.setFont(FONT,9.8); self.c.drawRightString(RIGHT,self.y,right)
        self.y-=12+after
    def role(self,left,right=''):
        self.c.setFont(ITALIC,10); self.c.drawString(LEFT,self.y,left)
        if right:
            self.c.setFont(FONT,9.8); self.c.drawRightString(RIGHT,self.y,right)
        self.y-=11.5
    def rich_line(self,text,size=10.2,indent=0,line_h=11.4,after=0):
        lines=wrap_rich(text,size,RIGHT-(LEFT+indent))
        for line in lines:
            x=LEFT+indent
            for token,font in line:
                self.c.setFont(font,size); self.c.drawString(x,self.y,token); x+=pdfmetrics.stringWidth(token,font,size)
            self.y-=line_h
        self.y-=after
    def bullet(self,text,after=0.8):
        bx=LEFT+3; tx=LEFT+14
        lines=wrap_rich(text,BODY,RIGHT-tx)
        self.c.setFont(FONT,BODY); self.c.drawString(bx,self.y,'•')
        for line in lines:
            x=tx
            for token,font in line:
                self.c.setFont(font,BODY); self.c.drawString(x,self.y,token); x+=pdfmetrics.stringWidth(token,font,BODY)
            self.y-=11.7
        self.y-=after
    def label(self,label,text,after=0.5):
        self.c.setFont(BOLD,10.2); self.c.drawString(LEFT,self.y,label)
        x0=LEFT+pdfmetrics.stringWidth(label,BOLD,10.2)
        # first-line width reduced by label; continuation full width
        words=rich_words(text)
        lines=[]; cur=[]; curw=0; lim=RIGHT-x0
        for token,font in words:
            tw=pdfmetrics.stringWidth(token,font,10.2)
            if cur and curw+tw>lim:
                lines.append((cur, x0 if not lines else LEFT)); cur=[(token,font)]; curw=tw; lim=RIGHT-LEFT
            else:
                cur.append((token,font)); curw+=tw
        if cur: lines.append((cur, x0 if not lines else LEFT))
        for line,x in lines:
            for token,font in line:
                self.c.setFont(font,10.2); self.c.drawString(x,self.y,token); x+=pdfmetrics.stringWidth(token,font,10.2)
            self.y-=11.3
        self.y-=after
    def finish(self):
        utilization=(H-M-self.y)/PRINTABLE*100
        if self.y < M-0.1:
            raise RuntimeError(f'Bottom margin violation {self.path.name}: y={self.y:.1f}, margin={M:.1f}')
        if utilization < 97.0:
            raise RuntimeError(f'Underutilized {self.path.name}: {utilization:.1f}%')
        if utilization > 100.0:
            raise RuntimeError(f'Overutilized {self.path.name}: {utilization:.1f}%')
        self.c.save()
        return utilization


def education(w):
    w.section('Education',1)
    w.twocol('University of Washington Bothell','Bothell, WA')
    w.role('Bachelor of Arts in Business Administration | GPA 3.64/4.00','Aug 2026')
    w.rich_line("Academic focus: Finance and Management Information Systems | Annual Dean's List 2024-2025",10.2,0,11.3,0)


def entry(w,name,date,context,bullets):
    w.twocol(name,date); w.role(context)
    for b in bullets: w.bullet(b)

SUMMARIES={
'finance':'Recent UW Business Administration graduate with experience in valuation, capital budgeting, Monte Carlo simulation, financial modeling, and decision analysis across research and finance projects.',
'analytics':'Recent UW Business Administration graduate combining Python, SQL, Excel, quantitative modeling, and process analytics to turn complex data and uncertain assumptions into decision-support systems.',
'product':'Recent UW Business Administration graduate working across product requirements, business systems, data architecture, testing, analytics, and AI-assisted development to turn ambiguous workflows into usable products.',
'operations':'Recent UW Business Administration graduate with experience in operational workflows, grant and compliance reporting, program coordination, stakeholder communication, event execution, and process automation.',
'consulting':'Recent UW Business Administration graduate with experience in client research, market analysis, strategic recommendations, financial analysis, case leadership, and cross-functional consulting deliverables.'
}


def finance():
    w=Writer(OUT/'Atharva_Barad_Finance_Resume.pdf','Atharva Barad - Finance & Strategic Analysis Resume',SUMMARIES['finance'])
    education(w)
    w.section('Professional Experience')
    entry(w,'United Indians of All Tribes Foundation','Nov 2023 - Nov 2025','Garden Intern Supervisor | Seattle, WA',[
        'Rebuilt quarterly volunteer reporting from paper logs into digital forms and an Excel workflow using Power Query, PivotTables, VBA/macros, validation, and error flags, cutting preparation from **roughly 4-8 hours to about 40 minutes**.',
        'Developed the proposal and budget for an awarded **$73,000 King County WaterWorks grant**; tracked spending, coordinated purchases with accounting/management, and prepared **8 quarterly compliance reports** across overlapping grant cycles.',
        'Increased volunteer participation by **approximately 70% year over year** through targeted outreach, consistent communication, and partnerships with local organizations.'
    ])
    w.section('Consulting & Finance Projects')
    entry(w,'Business Consulting Association, UW Bothell','Sep 2025 - Jun 2026','Student Consultant / Case Competition Team Lead | Bothell, WA',[
        'Advised Sky Rivers Advisory through competitor, client, **pricing**, and marketing research; translated findings into recommendations and performed substantial final deliverable QA on work the client described as **"five-star"**.',
        'Led a Major League Volleyball case team developing a **10-year media-led growth roadmap** around a **$20 million capital opportunity** and threefold valuation target, consolidating research, strategic options, and final presentation materials.'
    ])
    entry(w,'Monte Carlo International Expansion Research','Summer 2026','B BUS 499 Independent Study | Python / Monte Carlo | Grade 4.0',[
        'Built a Python Monte Carlo decision-support model for a 15-year, six-warehouse expansion, evaluating **12 scenarios x 10,000 paths each** and **23 stochastic country variables**.',
        'Mapped country risk into revenue, operating costs, working capital, construction timing, FX/inflation, financing capacity, and dynamic WACC using empirical distributions and a **23 x 23 dependence matrix**.',
        'Structured outputs around NPV/IRR, downside risk, investment timing, financing behavior, and completion; validated **157 archived core/FX/financing checks** plus reproduction of all 12 scenarios.'
    ])
    entry(w,'Costco Five-Warehouse Capital Budgeting','Summer 2026','B BUS 451 Team Project | Primary Analytical Lead | Grade 4.0',[
        'Led most research and modeling for a five-warehouse incremental cash-flow model covering merchandise and membership revenue, cannibalization, OpEx, CapEx, depreciation, working capital, taxes, and salvage.',
        'Evaluated a modeled $128.91M initial investment at **$140.96M NPV and 25.58% IRR** using an 8.18% WACC; scenario NPVs ranged from **$3.99M to $326.13M** and supported an internal-financing recommendation.',
        'Identified **mature revenue per warehouse** as the largest one-way NPV driver and variable warehouse cost as the second, translating sensitivity output into demand-ramp and cost-control priorities.'
    ])
    entry(w,'Apple Fundamental Analysis & Equity Valuation','Summer 2026','B BUS 454 Team Project | Part 3 Valuation / QA Lead | Grade 4.0',[
        'Led FCFF DCF, dividend-discount, and peer P/E valuation work; final submitted values were **$174.76/share, $22.03, and $140.55**, with a 9.01% WACC and 3.0% terminal growth in the FCFF case.',
        'Reconciled citations, source data, and output inconsistencies across the team deliverable, corrected a mismatched section, and standardized final report and presentation figures.'
    ])
    w.section('Skills & Credentials')
    w.label('Finance & Analytics: ','DCF/FCFF, DDM, P/E/comps, NPV/IRR, CAPP/WACC, capital budgeting, scenario/sensitivity, Monte Carlo; Excel, Python, SQL/PostgreSQL.')
    w.label('Credentials: ','Bloomberg Market Concepts (BMC); LinkedIn Learning Business Analysis Techniques for Business Transformation.',0)
    return w.finish()


def analytics():
    w=Writer(OUT/'Atharva_Barad_Analytics_Resume.pdf','Atharva Barad - Business & Data Analytics Resume',SUMMARIES['analytics'])
    education(w)
    w.section('Professional Experience')
    entry(w,'United Indians of All Tribes Foundation','Nov 2023 - Nov 2025','Garden Intern Supervisor | Seattle, WA',[
        'Rebuilt quarterly volunteer reporting from paper logs into digital forms and an Excel workflow using Power Query, PivotTables, VBA/macros, validation, and error flags, cutting preparation from **roughly 4-8 hours to about 40 minutes**.',
        'Designed validation and correction controls around required fields, timestamps, activity records, evidence, and reporting exceptions so incomplete submissions could be caught before quarterly consolidation.',
        'Prepared **8 quarterly compliance reports** across overlapping grant cycles, reconciling deliverables, expenditures, volunteer activity, and program outcomes.',
        'Used filters, lookups, charts, and forms integration to support repeatable reporting and faster retrieval of volunteer and program records.'
    ])
    w.section('Selected Analytics & Data Projects')
    entry(w,'Monte Carlo International Expansion Research','Summer 2026','B BUS 499 Independent Study | Python / Monte Carlo | Grade 4.0',[
        'Built a Python Monte Carlo model for a 15-year, six-warehouse expansion, evaluating **12 scenarios x 10,000 paths each** across **23 stochastic country variables**.',
        'Estimated empirical marginals and dependence structure, translated country conditions into financial drivers, and compared NPV/IRR, downside, financing, and rollout behavior across three strategies.',
        'Validated **157 archived core/FX/financing checks** plus reproduction of all 12 scenarios, emphasizing distribution-based decision support rather than single-point forecasts.'
    ])
    entry(w,'UniPath Student Lifecycle Platform','Mar - Jun 2026','B BUS 489 Five-Person MIS Capstone | PostgreSQL / Python | Grade 3.9',[
        'Designed a normalized **34-table PostgreSQL schema/ERD** with UUID primary keys, explicit foreign keys, and junction relationships spanning university search, applications, academic progress, and alumni outcomes.',
        'Built the Python proof of concept for multidimensional ranking, semantic matching, calibrated admission estimates, and early-warning academic-risk workflows using **synthetic/prepared data**.',
        'Co-developed broader six-layer architecture and API/data-flow concepts with the team, integrating the schema and analytical prototype into the shared system design.'
    ])
    entry(w,'CSS 475 Database Systems','2026','PostgreSQL / SQL Coursework and Team Database/API Work',[
        'Built and tested PostgreSQL/SQL functionality using schemas/ERDs, parameterized queries, joins, reads/writes, input validation, and Python-backed database APIs.',
        'Applied database design, retrieval/update, application integration, transactions, and optimization concepts, supporting working SQL/PostgreSQL capability rather than enterprise DBA claims.'
    ])
    entry(w,'Costco Singapore Market Entry','Mar - Jun 2026','B BUS 480 Team Project | Country Screening / Financial Research / QA | Grade 4.0',[
        'Spearheaded the country-screening model by structuring the framework, researching inputs, helping define criteria, and validating data/scoring used to compare Singapore, South Korea, and Japan.',
        'Performed cross-module QA on statistics, assumptions/settings, appendices, and final formatting while connecting the screening output to pricing, financial, and operating considerations.',
        'Extended the country comparison into **PESTLE/CST, localization, membership pricing, 3-year financial assumptions, and entry-mode/logistics** rather than stopping at a composite score.'
    ])
    w.section('Skills & Credentials',1)
    w.label('Analytics & Data: ','Python, pandas, NumPy, SQL/PostgreSQL, Excel formulas, PivotTables, Power Query, VBA/macros, validation, Tableau; Power BI working knowledge.')
    w.label('Methods: ','Monte Carlo, scenario/sensitivity analysis, relational modeling, data validation, requirements/workflows, testing/QA; BMC credential.',0)
    return w.finish()


def product():
    w=Writer(OUT/'Atharva_Barad_Product_Systems_Resume.pdf','Atharva Barad - Product & Business Systems Resume',SUMMARIES['product'])
    education(w)
    w.section('Professional Experience')
    entry(w,'United Indians of All Tribes Foundation','Nov 2023 - Nov 2025','Garden Intern Supervisor | Seattle, WA',[
        'Rebuilt a fragmented volunteer-reporting process from paper logs into digital forms and an Excel workflow with structured inputs, validation, correction paths, and automated consolidation, reducing preparation from **roughly 4-8 hours to about 40 minutes**.',
        'Designed and led a **6-week horticulture and water-systems internship for 8 interns** using structured learning plans, weekly check-ins, individualized feedback, and performance metrics.'
    ])
    w.section('Product & Systems Projects')
    entry(w,'System (formerly MasterBase)','Aug 2026 - Present','Personal Product / Software Project | Kotlin Multiplatform / SQLDelight / Supabase',[
        'Define product requirements, UI flows, analytics rules, offline/sync behavior, scope decisions, and acceptance criteria for a Kotlin Multiplatform Android/Desktop personal-data platform.',
        'Designed local-first behavior around **stable record IDs, pending mutations, conflict handling, and historical representations** so later edits do not rewrite historical analytical truth.',
        'Read and modify Kotlin and SQL directly, field-test Android/Desktop behavior, and use regression cases for offline edits, timestamps, historical personal bests, invalid observations, and sync conflicts.',
        'Converted outside-user field-test findings into product requirements for onboarding, builder discoverability, execution correctness, schedule semantics, and error/recovery behavior.',
        'Built a GitHub-backed **multi-worker relay workflow** to coordinate AI-assisted implementation, debugging, audits, test expansion, and handoffs with explicit task contracts and validation gates.'
    ])
    entry(w,'UniPath Student Lifecycle Platform','Mar - Jun 2026','B BUS 489 Five-Person MIS Capstone | PostgreSQL / Python | Grade 3.9',[
        'Designed a normalized **34-table PostgreSQL schema/ERD** spanning university search, applications, academic progress, and alumni outcomes with UUID keys, foreign keys, and junction relationships.',
        'Built the Python proof of concept for ranking, semantic matching, admission-estimate, and academic-risk workflows using **synthetic/prepared data**.',
        'Co-developed six-layer architecture, API/data-flow concepts, role-based journeys, and explainability/fallback/privacy considerations with the five-person team.'
    ])
    entry(w,'CommuteWise','2026','CSS 360 Software Engineering Team Project | FastAPI / Map APIs',[
        'Contributed product/feature ideation, requirements consolidation across project phases, integration review, manual/user testing, bug identification, and final-release validation for a map-based commute-analysis application.',
        'Focused primarily on product/process and QA while another teammate drove much of the implementation; the released app uses a **FastAPI backend plus external map APIs** for saved locations, routes, and historical commute statistics.'
    ])
    entry(w,'CSS 475 Database Systems','2026','PostgreSQL / SQL Coursework and Team Database/API Work',[
        'Built and tested PostgreSQL/SQL database functionality using schemas/ERDs, parameterized queries, joins, reads/writes, validation, and Python-backed database APIs.',
        'Applied transactions, optimization, application integration, and relational-design concepts that support product requirements and data-layer implementation decisions.'
    ])
    w.section('Skills')
    w.label('Product & Systems: ','Requirements, workflow/process design, UI/UX, testing/regression, Kotlin/KMP, Compose Multiplatform, SQLDelight, Supabase/Postgres, APIs/data flow, Git/GitHub.')
    w.label('Analytics & Data: ','Python, SQL/PostgreSQL, relational modeling, Excel/Power Query/VBA, analytics semantics, local-first/offline-sync concepts.',0)
    return w.finish()


def operations():
    w=Writer(OUT/'Atharva_Barad_Operations_Resume.pdf','Atharva Barad - Operations & Program Management Resume',SUMMARIES['operations'])
    education(w)
    w.section('Professional Experience')
    entry(w,'United Indians of All Tribes Foundation','Nov 2023 - Nov 2025','Garden Intern Supervisor | Seattle, WA',[
        'Rebuilt quarterly volunteer reporting from paper logs into digital forms and an Excel workflow, reducing end-to-end preparation from **roughly 4-8 hours to about 40 minutes** while adding validation and correction controls.',
        'Developed the proposal and budget for an awarded **$73,000 King County WaterWorks grant**; tracked spending, coordinated purchases with accounting/management, and prepared **8 quarterly compliance reports**.',
        'Increased volunteer participation by **approximately 70% year over year** through targeted outreach, consistent communication, and partnerships with local organizations.',
        'Designed and led a **6-week horticulture and water-systems internship for 8 interns** using weekly check-ins, structured learning plans, individualized feedback, and performance metrics.',
        'Coordinated volunteer schedules, garden operations, community programming, and partner/resident communication while supporting day-to-day execution across changing operational needs.'
    ])
    entry(w,'N&M Events','Jun 2023 - Present','Event Staff / Operations Support | On-call Family Business | Kent, WA',[
        'Supported **50+ private, cultural, and corporate events** for roughly **10-200 attendees**, coordinating decor staging, venue setup/layouts, equipment, transportation, inventory, and rapid day-of adjustments.',
        'Worked directly with family operators, clients, and event teams to interpret changing needs and translate them into setup and logistics decisions during live events.'
    ])
    w.section('Consulting & Process Projects')
    entry(w,'Business Consulting Association, UW Bothell','Sep 2025 - Jun 2026','Student Consultant / Case Competition Team Lead | Bothell, WA',[
        'Completed **2 client engagements and 3 case competitions** spanning research, scoping, analysis, recommendation development, presentations, team coordination, and final-deliverable QA.',
        'Led an ad hoc soybean-export case team after original teammates withdrew, delegated workstreams by strengths, and synthesized trade, finance, marketing, and contract research into a coherent recommendation.',
        'Led the Major League Volleyball case from research through final presentation, coordinating team contributions and consolidating strategic options into a 10-year media-led growth roadmap.'
    ])
    entry(w,'System (formerly MasterBase)','Aug 2026 - Present','Personal Product / Software Project | Workflow / QA Focus',[
        'Define workflows, acceptance criteria, state rules, and failure behavior for scheduling, logging, history, analytics, offline edits, and sync behavior in a multi-platform personal-data system.',
        'Use staged validation, regression checks, and explicit task ownership to move AI-assisted implementation through development without treating a successful build as proof that the workflow is correct.'
    ])
    entry(w,'CommuteWise','2026','CSS 360 Software Engineering Team Project | Product / Process / QA Focus',[
        'Contributed requirements consolidation, integration review, manual/user testing, bug identification, and final-release validation across multiple project phases for a map-based commute-analysis application.',
        'Focused on product/process and QA while another teammate drove much of the implementation, helping reconcile feature behavior and identify issues before release.'
    ])
    w.section('Skills')
    w.label('Operations: ','Process improvement, program coordination, stakeholder communication, grant budgeting/compliance, reporting, event logistics, training/intern supervision, deliverable QA.')
    w.label('Tools: ','Excel, Power Query, PivotTables, VBA/macros, validation, Python, SQL/PostgreSQL, requirements/workflows, testing/regression.',0)
    return w.finish()


def consulting():
    w=Writer(OUT/'Atharva_Barad_Consulting_Strategy_Resume.pdf','Atharva Barad - Consulting & Strategy Resume',SUMMARIES['consulting'])
    education(w)
    w.section('Consulting & Leadership')
    entry(w,'Business Consulting Association, UW Bothell','Sep 2025 - Jun 2026','Student Consultant / Case Competition Team Lead | Bothell, WA',[
        'Advised Sky Rivers Advisory through competitor, client, pricing, and marketing research; translated findings into recommendations and performed substantial final QA on deliverables the client described as **"five-star work"**.',
        'Conducted local-community, interview, historical, online-forum, and social-sentiment research for a regional credit-union client, converting findings into recommendations on partnerships, programming, and space use.',
        'Led a Major League Volleyball case team developing a **10-year media-led growth roadmap** around a **$20 million capital opportunity** and threefold valuation target, consolidating research and presentation materials.',
        'Led an ad hoc soybean-export case team after teammate withdrawals, delegating workstreams by strengths and synthesizing trade, finance, marketing, and contract research into the final recommendation.'
    ])
    w.section('Professional Experience')
    entry(w,'United Indians of All Tribes Foundation','Nov 2023 - Nov 2025','Garden Intern Supervisor | Seattle, WA',[
        'Developed the proposal and budget for an awarded **$73,000 WaterWorks grant** and supported post-award spending coordination, purchasing, and **8 quarterly compliance reports** across overlapping grant cycles.',
        'Rebuilt volunteer reporting from paper logs into a controlled Excel workflow, reducing quarterly preparation from **roughly 4-8 hours to about 40 minutes** by redesigning information collection and reporting controls.',
        'Raised volunteer participation **approximately 70% YoY** through targeted outreach and local partnerships.'
    ])
    w.section('Selected Strategy Projects')
    entry(w,'Costco Singapore Market Entry','Mar - Jun 2026','B BUS 480 Team Project | Country Screening / Financial Research / QA | Grade 4.0',[
        'Spearheaded the country-screening model by structuring the framework, researching inputs, helping define criteria, and validating data/scoring; the team ranked **Singapore 7.50** versus 6.25 for South Korea and 5.35 for Japan.',
        'Extended the ranking into operating questions around pricing, membership economics, market conditions, startup capital, and implementation constraints rather than treating the highest score as an automatic recommendation.'
    ])
    entry(w,'WEBTOON Strategic Management Capstone','Summer 2026','B BUS 470 Four-Person Team Project | Strategy / Deliverable QA | Grade 4.0',[
        'Owned assigned analysis covering organizational structure, Five Forces, competitor/Blue Ocean/CSR, company timeline, intra-firm value chain, and TMT/board matrix; presented slides 4-6.',
        'Reconciled citations, formatting, background consistency, and cross-section issues across the final deck to improve coherence between the team\'s strategic analyses.'
    ])
    entry(w,'Monte Carlo International Expansion Research','Summer 2026','B BUS 499 Independent Study | Strategy / Finance Decision Support | Grade 4.0',[
        'Compared **12 country-type / rollout configurations** across 120,000 simulated paths, separating strategic importance from financial sensitivity and evaluating how financing constraints could change the realized expansion path.',
        'Used distribution-based NPV/IRR and completion results to frame expansion as a tradeoff among execution certainty, sponsor capital, timing, downside, and strategic completion rather than a single forecast.'
    ])
    w.section('Skills & Credentials',0)
    w.label('Consulting & Strategy: ','Market/competitive research, stakeholder research, financial analysis, scenario analysis, strategy frameworks, presentations, client deliverable QA, team leadership.',0)
    w.label('Tools & Credentials: ','Excel, Python, SQL/PostgreSQL, Tableau; Bloomberg Market Concepts (BMC); LinkedIn Learning Business Analysis.',0)
    return w.finish()

if __name__=='__main__':
    vals={
      'Finance':finance(),
      'Analytics':analytics(),
      'Product':product(),
      'Operations':operations(),
      'Consulting':consulting(),
    }
    # Backward-compatible direct resume URL uses the broad Analytics & Decision Support version.
    import shutil
    shutil.copyfile(OUT/'Atharva_Barad_Analytics_Resume.pdf', OUT/'Atharva_Barad_Resume.pdf')
    for k,v in vals.items():
        print(f'{k} utilization: {v:.1f}%')
