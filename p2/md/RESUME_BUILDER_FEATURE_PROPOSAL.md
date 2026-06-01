# Resume Builder Feature Proposal

## Objective
Add a native Resume Builder to Intrex so users can create professional resumes directly in the platform, choose modern ATS-friendly templates, preview resumes, and export them for applications.

## Why this fits
- Complements existing resume analysis functionality.
- Offers a full workflow: build resume → analyze quality/ATS score → export.
- Increases value for students and job seekers using Intrex.

## Core MVP
- Resume creation form with structured sections:
  - Contact details
  - Summary / objective
  - Experience
  - Education
  - Skills
  - Certifications / awards
  - Projects
  - Additional sections (optional)
- Template selector with multiple ATS-friendly and career-oriented layouts.
- Live preview pane showing selected template.
- Export options: PDF, plain text, and Markdown / JSON import-export.
- Save drafts to user profile or browser local storage.
- Reuse existing advanced resume analysis API to evaluate created resumes.
- Job description matcher for keyword matching and compatibility checks.
- Skill tags/chips instead of plain text skill lines.
- Smart AI-guided suggestions for summary length, achievements, ATS optimization.

## Advanced features
- Multiple dedicated templates:
  - Minimal ATS Friendly
  - Developer / Tech Style
  - Corporate Professional
  - Fresher / Student
  - Compact One-Page Resume
- ATS analysis improvements:
  - ATS score with progress bar
  - Missing keyword detection
  - Resume strength analysis
  - Weak action verb detection
  - Formatting suggestions
- Job Description matcher:
  - Keyword match percentage
  - Missing skills / keywords
  - ATS compatibility summary
- Improved resume preview:
  - Larger A4-style live preview
  - Sticky preview sidebar while scrolling
  - Better spacing and typography
  - PDF-like layout for more realistic export experience
- Better skill formatting with tags/chips/badges.
- GitHub profile import for developers to auto-fill:
  - projects
  - tech stack
  - skills
  - profile links
- Smart suggestions and inline feedback:
  - Professional summary too short
  - Add measurable achievements
  - Projects section missing
  - Resume can be optimized for ATS
- Template labels for clarity:
  - ATS Friendly
  - Best for Developers
  - Best for Freshers
  - Most Popular

## Key screens
1. `Resume Builder` landing page
   - Start new resume
   - Load saved draft
   - Import uploaded resume text
   - Import GitHub profile
2. `Resume Form` editor
   - Add/remove sections
   - Inline field editing
   - Skill tag/chip input
   - Job description matcher input
3. `Template Selector`
   - Show sample layouts
   - Highlight labels like ATS Friendly, Best for Developers, Best for Freshers
4. `Review & Export`
   - Resume preview
   - ATS score / quick suggestions
   - Download PDF / DOCX / Markdown / JSON

## Backend integration
### New service
- `backend/services/resume_builder.py` or extend current `resume_analyzer.py`
- Functions:
  - `format_resume_for_template(data, template_id)`
  - `generate_pdf_resume(data, template_id)` (optional server-side export)
  - `score_resume_text(resume_text, job_profile)` reuses ATS analysis logic

### New API router
- `backend/routers/resume_builder.py`
- Endpoints:
  - `GET /api/resume-builder/drafts` — list user drafts
  - `POST /api/resume-builder/draft` — create or update a draft
  - `DELETE /api/resume-builder/draft/{id}` — delete a draft
  - `POST /api/resume-builder/render` — return HTML/JSON preview
  - `POST /api/resume-builder/export` — return PDF/DOCX export (optional)
  - `POST /api/resume-builder/ats-score` — analyze builder output with existing logic

### Data model
- New `ResumeDraft` model or reuse existing user metadata fields
- Fields:
  - `user_id`
  - `title`
  - `template_id`
  - `resume_data` (JSON)
  - `created_at`, `updated_at`

## Frontend design
### New pages/components
- `frontend/src/pages/ResumeBuilder.tsx`
- `frontend/src/components/ResumeTemplateSelector.tsx`
- `frontend/src/components/ResumePreview.tsx`
- `frontend/src/components/ResumeFormSection.tsx`
- `frontend/src/components/ResumeExportControls.tsx`

### Flow
- User chooses template
- Fills resume sections in form fields
- Preview updates instantly
- Click `Analyze` to run ATS feedback via backend
- Click `Download` to export

### Template approach
- Build templates as React layout components with simple CSS / Tailwind.
- Ensure templates are:
  - Single-column
  - Clear headings
  - Strong typography
  - ATS-safe text structure
- Support light/dark mode if the app already has theme support.

## Implementation plan
1. Add docs and wireframes for the resume builder feature.
2. Create backend resume builder router + service.
3. Add frontend page and form components.
4. Hook builder output into existing ATS analysis endpoints.
5. Add export support using `html-to-pdf` or client-side PDF generation.
6. Test with saved drafts and exported files.

## Suggested next step
Begin by adding a dedicated `Resume Builder` page in the frontend and a lightweight API route for saving/loading drafts. Once the editor is working, integrate the existing ATS analyzer to make the feature feel complete.
