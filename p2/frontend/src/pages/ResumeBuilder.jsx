import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, Sparkles, FileText, Plus, Minus, CheckCircle2, Shield, Clipboard, ArrowRight, AlertTriangle } from 'lucide-react'

const TEMPLATE_OPTIONS = [
  {
    id: 'modern',
    label: 'Modern',
    description: 'Clean headings, strong spacing, ATS-friendly.',
  },
  {
    id: 'professional',
    label: 'Professional',
    description: 'Classic layout with bold section titles.',
  },
  {
    id: 'minimal',
    label: 'Minimal',
    description: 'Simple one-column format with crisp readability.',
  },
]

const emptyExperience = { role: '', company: '', dates: '', details: '' }
const emptyEducation = { school: '', degree: '', dates: '', details: '' }

const loadDraft = () => {
  try {
    const raw = window.localStorage.getItem('intrex_resume_builder_draft')
    return raw ? JSON.parse(raw) : null
  } catch (error) {
    return null
  }
}

const saveDraft = (draft) => {
  try {
    window.localStorage.setItem('intrex_resume_builder_draft', JSON.stringify(draft))
  } catch (error) {
    // Ignore storage errors
  }
}

const buildResumeText = ({ contact, summary, experience, education, skills, projects, certifications }) => {
  const lines = []
  if (contact.name) lines.push(contact.name)
  if (contact.email || contact.phone || contact.website) {
    lines.push([contact.email, contact.phone, contact.website].filter(Boolean).join(' | '))
  }
  if (contact.location) lines.push(contact.location)
  if (summary) {
    lines.push('\nSummary')
    lines.push(summary)
  }

  if (experience.length) {
    lines.push('\nExperience')
    experience.forEach((item) => {
      if (!item.role && !item.company) return
      lines.push(`${item.role || 'Role'} — ${item.company || 'Company'} (${item.dates || 'Dates'})`)
      if (item.details) lines.push(item.details)
    })
  }

  if (education.length) {
    lines.push('\nEducation')
    education.forEach((item) => {
      if (!item.school) return
      lines.push(`${item.degree || 'Degree'} — ${item.school} (${item.dates || 'Dates'})`)
      if (item.details) lines.push(item.details)
    })
  }

  if (skills) {
    lines.push('\nSkills')
    lines.push(skills)
  }
  if (projects) {
    lines.push('\nProjects')
    lines.push(projects)
  }
  if (certifications) {
    lines.push('\nCertifications')
    lines.push(certifications)
  }

  return lines.filter(Boolean).join('\n')
}

const ResumeBuilder = () => {
  const draft = loadDraft()
  const [template, setTemplate] = useState(draft?.template || 'modern')
  const [title, setTitle] = useState(draft?.title || 'Professional Resume')
  const [contact, setContact] = useState(draft?.contact || { name: '', email: '', phone: '', website: '', location: '' })
  const [summary, setSummary] = useState(draft?.summary || '')
  const [experience, setExperience] = useState(draft?.experience || [emptyExperience])
  const [education, setEducation] = useState(draft?.education || [emptyEducation])
  const [skills, setSkills] = useState(draft?.skills || '')
  const [projects, setProjects] = useState(draft?.projects || '')
  const [certifications, setCertifications] = useState(draft?.certifications || '')
  const [jobDescription, setJobDescription] = useState(draft?.job_description || '')
  const [jobMatchResult, setJobMatchResult] = useState(null)
  const [matchingJobDescription, setMatchingJobDescription] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [loadingAnalysis, setLoadingAnalysis] = useState(false)
  const [statusMessage, setStatusMessage] = useState('Draft saved automatically')
  const [errorMessage, setErrorMessage] = useState('')

  const resumeText = useMemo(
    () => buildResumeText({ contact, summary, experience, education, skills, projects, certifications }),
    [contact, summary, experience, education, skills, projects, certifications]
  )

  const skillTags = useMemo(() => {
    return skills
      .split(/[\n,;]+/)
      .map((value) => value.trim())
      .filter(Boolean)
  }, [skills])

  useEffect(() => {
    saveDraft({ template, title, contact, summary, experience, education, skills, projects, certifications, job_description: jobDescription })
    setStatusMessage('Draft saved automatically')
  }, [template, title, contact, summary, experience, education, skills, projects, certifications, jobDescription])

  const setExperienceField = (index, field, value) => {
    setExperience(prev => prev.map((item, idx) => idx === index ? { ...item, [field]: value } : item))
  }

  const setEducationField = (index, field, value) => {
    setEducation(prev => prev.map((item, idx) => idx === index ? { ...item, [field]: value } : item))
  }

  const addExperience = () => setExperience(prev => [...prev, emptyExperience])
  const removeExperience = (index) => setExperience(prev => prev.filter((_, idx) => idx !== index))
  const addEducation = () => setEducation(prev => [...prev, emptyEducation])
  const removeEducation = (index) => setEducation(prev => prev.filter((_, idx) => idx !== index))

  const handleDownloadText = () => {
    const blob = new Blob([resumeText], { type: 'text/plain;charset=utf-8' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${title.replace(/\s+/g, '_').toLowerCase() || 'resume'}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const downloadExport = async (format) => {
    setErrorMessage('')
    setStatusMessage('Preparing export...')
    try {
      const response = await fetch('/api/resume-builder/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_data: { title, contact, summary, experience, education, skills, projects, certifications, job_description: jobDescription },
          template_id: template,
          format,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => null)
        let errorMessage = 'Export failed'
        try {
          const errorData = errorText ? JSON.parse(errorText) : null
          errorMessage = errorData?.detail || errorData?.message || errorMessage
        } catch {
          if (errorText) errorMessage = errorText
        }
        throw new Error(errorMessage)
      }

      const blob = await response.blob()
      const extension = format === 'markdown' ? 'md' : format === 'html' ? 'html' : format === 'json' ? 'json' : format === 'pdf' ? 'pdf' : format === 'word' ? 'docx' : 'txt'
      const filename = `${title.replace(/\s+/g, '_').toLowerCase() || 'resume'}.${extension}`
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      setStatusMessage(`Downloaded ${format.toUpperCase()} export`)
    } catch (error) {
      setErrorMessage(error.message || 'Export failed')
      setStatusMessage('')
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(resumeText)
      setStatusMessage('Resume copied to clipboard')
    } catch (error) {
      setErrorMessage('Unable to copy to clipboard. Please copy manually.')
    }
  }

  const matchJobDescription = async () => {
    if (!jobDescription.trim()) {
      setErrorMessage('Please add a job description to compare.')
      return
    }
    setMatchingJobDescription(true)
    setJobMatchResult(null)
    setErrorMessage('')
    try {
      const response = await fetch('/api/resume-builder/match-job-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume_data: { title, template_id: template, contact, summary, experience, education, skills, projects, certifications }, job_description: jobDescription })
      })

      const rawText = await response.text()
      let data = null
      if (rawText) {
        try {
          data = JSON.parse(rawText)
        } catch (parseError) {
          if (!response.ok) {
            throw new Error(rawText || `Job description matcher failed with status ${response.status}`)
          }
          throw new Error('Unexpected response format from job description matcher.')
        }
      }

      if (!response.ok) {
        throw new Error(data?.detail || data?.message || `Job description matcher failed with status ${response.status}`)
      }

      setJobMatchResult(data?.match ?? null)
      setStatusMessage('JD match complete')
    } catch (error) {
      setErrorMessage(error.message || 'Job description matcher failed')
    } finally {
      setMatchingJobDescription(false)
    }
  }

  const analyzeResume = async () => {
    setLoadingAnalysis(true)
    setErrorMessage('')
    setAnalysis(null)
    try {
      const response = await fetch('/api/resume/analyze-advanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume_text: resumeText }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || 'Analysis request failed')
      }
      setAnalysis(data.analysis || data)
      setStatusMessage('Analysis complete')
    } catch (error) {
      setErrorMessage(error.message || 'Analysis failed')
    } finally {
      setLoadingAnalysis(false)
    }
  }

  const templateStyles = {
    modern: 'bg-slate-950 text-white',
    professional: 'bg-white text-slate-950 border border-slate-200',
    minimal: 'bg-slate-50 text-slate-950',
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-4 py-8 sm:px-6 lg:px-10">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-8 shadow-2xl shadow-black/20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <Link to="/" className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10">
                  Home
                </Link>
                <p className="text-sm uppercase tracking-[0.24em] text-teal-300">New feature</p>
              </div>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">Resume Builder</h1>
              <p className="mt-3 max-w-2xl text-slate-400">Create ATS-friendly resumes inside Intrex, choose a template, preview content, and export a polished resume draft.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <button onClick={handleDownloadText} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-400">
                <Download className="h-4 w-4" /> Download text
              </button>
              <button onClick={handleCopy} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition hover:bg-white/10">
                <Clipboard className="h-4 w-4" /> Copy text
              </button>
              <button onClick={analyzeResume} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400">
                <Sparkles className="h-4 w-4" /> Analyze resume
              </button>
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {TEMPLATE_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setTemplate(option.id)}
                className={`rounded-3xl border p-4 text-left transition ${template === option.id ? 'border-teal-400 bg-white/10' : 'border-white/10 bg-white/5 hover:border-white/20'}`}>
                <p className="font-semibold text-white">{option.label}</p>
                <p className="mt-2 text-sm text-slate-400">{option.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-6 rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-lg shadow-black/10">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-white">Resume editor</h2>
                <p className="mt-2 text-sm text-slate-400">Build sections, save progress automatically, and preview the result in real time.</p>
              </div>
              <div className="rounded-2xl bg-slate-800 px-4 py-3 text-sm text-slate-200">Template: {template}</div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-slate-200">Document title</span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Professional Resume"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-teal-400"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-200">Location</span>
                <input
                  value={contact.location}
                  onChange={(e) => setContact(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="City, Country"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-teal-400"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block">
                <span className="text-sm font-semibold text-slate-200">Name</span>
                <input
                  value={contact.name}
                  onChange={(e) => setContact(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Jane Doe"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-teal-400"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-200">Email</span>
                <input
                  value={contact.email}
                  onChange={(e) => setContact(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="jane@example.com"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-teal-400"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-200">Phone</span>
                <input
                  value={contact.phone}
                  onChange={(e) => setContact(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(123) 456-7890"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-teal-400"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-semibold text-slate-200">Professional summary</span>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={4}
                placeholder="Senior candidate with experience in product-led growth, resume optimization, and interview readiness..."
                className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-teal-400"
              />
            </label>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">Experience</h3>
                  <p className="text-sm text-slate-500">List up to 3 roles with bullet summary details.</p>
                </div>
                <button
                  type="button"
                  onClick={addExperience}
                  className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-slate-100 transition hover:bg-white/10">
                  <Plus className="h-4 w-4" /> Add role
                </button>
              </div>
              <div className="space-y-4">
                {experience.map((item, index) => (
                  <div key={index} className="rounded-3xl border border-white/10 bg-slate-950/80 p-4">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <input value={item.role} onChange={(e) => setExperienceField(index, 'role', e.target.value)} placeholder="Role title" className="rounded-2xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none" />
                      <input value={item.company} onChange={(e) => setExperienceField(index, 'company', e.target.value)} placeholder="Company" className="rounded-2xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none" />
                      <input value={item.dates} onChange={(e) => setExperienceField(index, 'dates', e.target.value)} placeholder="Dates" className="rounded-2xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none" />
                    </div>
                    <textarea value={item.details} onChange={(e) => setExperienceField(index, 'details', e.target.value)} rows={3} placeholder="Key achievements and impact" className="mt-3 w-full rounded-3xl border border-white/10 bg-slate-900 px-3 py-3 text-sm text-white outline-none" />
                    {experience.length > 1 && (
                      <button type="button" onClick={() => removeExperience(index)} className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-rose-400 hover:text-rose-200">
                        <Minus className="h-4 w-4" /> Remove role
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">Education</h3>
                  <p className="text-sm text-slate-500">Add degrees, certifications, or training.</p>
                </div>
                <button type="button" onClick={addEducation} className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-slate-100 transition hover:bg-white/10">
                  <Plus className="h-4 w-4" /> Add school
                </button>
              </div>
              <div className="space-y-4">
                {education.map((item, index) => (
                  <div key={index} className="rounded-3xl border border-white/10 bg-slate-950/80 p-4">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <input value={item.degree} onChange={(e) => setEducationField(index, 'degree', e.target.value)} placeholder="Degree" className="rounded-2xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none" />
                      <input value={item.school} onChange={(e) => setEducationField(index, 'school', e.target.value)} placeholder="School" className="rounded-2xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none" />
                      <input value={item.dates} onChange={(e) => setEducationField(index, 'dates', e.target.value)} placeholder="Dates" className="rounded-2xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none" />
                    </div>
                    <textarea value={item.details} onChange={(e) => setEducationField(index, 'details', e.target.value)} rows={2} placeholder="Honors, coursework, GPA" className="mt-3 w-full rounded-3xl border border-white/10 bg-slate-900 px-3 py-3 text-sm text-white outline-none" />
                    {education.length > 1 && (
                      <button type="button" onClick={() => removeEducation(index)} className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-rose-400 hover:text-rose-200">
                        <Minus className="h-4 w-4" /> Remove school
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <label className="block">
              <span className="text-sm font-semibold text-slate-200">Skills</span>
              <textarea value={skills} onChange={(e) => setSkills(e.target.value)} rows={3} placeholder="e.g. JavaScript, React, ATS optimization, user research" className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none" />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-200">Projects</span>
              <textarea value={projects} onChange={(e) => setProjects(e.target.value)} rows={3} placeholder="Brief project summaries with outcomes" className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none" />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-200">Job description</span>
              <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} rows={4} placeholder="Paste the target job description to compare keywords and ATS fit" className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none" />
            </label>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button type="button" onClick={matchJobDescription} disabled={matchingJobDescription} className="inline-flex items-center justify-center gap-2 rounded-3xl bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60">
                <ArrowRight className="h-4 w-4" /> {matchingJobDescription ? 'Matching...' : 'Match JD'}
              </button>
              {jobMatchResult && (
                <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-4 text-sm text-slate-300">
                  <p className="font-semibold text-white">JD match</p>
                  <p className="mt-1">Match score: <span className="font-semibold text-teal-300">{jobMatchResult.match_percentage}%</span></p>
                  <p className="mt-1">Missing keywords: {jobMatchResult.missing_keywords.slice(0, 10).join(', ') || 'None'}</p>
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-4 text-slate-400">
              <p className="text-sm font-semibold text-white">Quick tips</p>
              <ul className="mt-3 space-y-2 text-sm">
                <li className="flex items-start gap-2"><CheckCircle2 className="mt-1 h-4 w-4 text-emerald-400" /> Use short impact statements with metrics.</li>
                <li className="flex items-start gap-2"><Shield className="mt-1 h-4 w-4 text-sky-400" /> Keep formatting simple for ATS parsing.</li>
                <li className="flex items-start gap-2"><FileText className="mt-1 h-4 w-4 text-violet-400" /> Prioritize readable headings and bullet-style details.</li>
              </ul>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-lg shadow-black/20">
              <div className="flex items-center gap-3 text-slate-200">
                <Sparkles className="h-5 w-5 text-teal-300" />
                <div>
                  <p className="font-semibold text-white">Live preview</p>
                  <p className="text-sm text-slate-400">Your resume updates as you type.</p>
                </div>
              </div>
              <div className={`mt-6 rounded-3xl border border-white/10 p-6 ${templateStyles[template]}`}>
                <div className={`${template === 'professional' ? 'text-slate-950' : template === 'minimal' ? 'text-slate-950' : 'text-white'}`}>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold">{contact.name || 'Your Name'}</h2>
                    <p className="text-sm opacity-80">{[contact.email, contact.phone, contact.website].filter(Boolean).join(' • ')}</p>
                    <p className="text-sm opacity-70">{contact.location}</p>
                  </div>
                  <div className="mt-6 space-y-4">
                    {summary && (
                      <div>
                        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-300">Summary</h3>
                        <p className="mt-2 text-sm leading-6 opacity-90">{summary}</p>
                      </div>
                    )}
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-300">Experience</h3>
                      <div className="mt-3 space-y-3">
                        {experience.filter(item => item.role || item.company).map((item, index) => (
                          <div key={index} className="space-y-1">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
                              <p className="font-semibold">{item.role || 'Role'} — {item.company || 'Company'}</p>
                              <p className="text-sm opacity-70">{item.dates || 'Dates'}</p>
                            </div>
                            <p className="text-sm leading-6 opacity-80">{item.details || 'Details about your achievements and impact.'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-300">Education</h3>
                      <div className="mt-3 space-y-3">
                        {education.filter(item => item.school).map((item, index) => (
                          <div key={index} className="space-y-1">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
                              <p className="font-semibold">{item.degree || 'Degree'} — {item.school}</p>
                              <p className="text-sm opacity-70">{item.dates || 'Dates'}</p>
                            </div>
                            <p className="text-sm leading-6 opacity-80">{item.details || 'Coursework, honors, or relevant awards.'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    {skills && (
                      <div>
                        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-300">Skills</h3>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {skillTags.map((tag, idx) => (
                            <span key={idx} className="rounded-full border border-white/10 bg-teal-500/15 px-3 py-1 text-xs font-medium text-teal-200">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {projects && (
                      <div>
                        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-300">Projects</h3>
                        <p className="mt-2 text-sm leading-6 opacity-90">{projects}</p>
                      </div>
                    )}
                    {certifications && (
                      <div>
                        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-300">Certifications</h3>
                        <p className="mt-2 text-sm leading-6 opacity-90">{certifications}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-lg shadow-black/10">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-sky-300" />
                <div>
                  <p className="font-semibold text-white">Resume status</p>
                  <p className="text-sm text-slate-400">{statusMessage}</p>
                </div>
              </div>
              {errorMessage && (
                <div className="mt-4 rounded-3xl bg-rose-500/10 p-4 text-sm text-rose-100">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{errorMessage}</span>
                  </div>
                </div>
              )}
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between rounded-3xl border border-white/10 bg-slate-950/70 p-4">
                  <div>
                    <p className="text-sm text-slate-400">Characters</p>
                    <p className="mt-1 text-xl font-semibold text-white">{resumeText.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Sections</p>
                    <p className="mt-1 text-xl font-semibold text-white">{1 + experience.length + education.length + (skills ? 1 : 0) + (projects ? 1 : 0) + (certifications ? 1 : 0)}</p>
                  </div>
                </div>
                {analysis && (
                  <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm text-slate-400">Overall score</p>
                        <p className="mt-1 text-3xl font-semibold text-white">{analysis.overall_score ?? analysis.ats_score ?? 'N/A'}</p>
                      </div>
                      <span className="inline-flex items-center gap-2 rounded-full bg-teal-500/10 px-3 py-2 text-sm font-medium text-teal-300">{analysis.ats_score ? `ATS ${analysis.ats_score}/100` : 'ATS analysis'}</span>
                    </div>
                    {analysis.improvement_suggestions?.length > 0 && (
                      <div className="mt-4 space-y-2 text-sm text-slate-300">
                        <p className="font-semibold text-white">Suggestions</p>
                        <ul className="list-disc pl-5">
                          {analysis.improvement_suggestions.slice(0, 3).map((suggestion, idx) => (
                            <li key={idx}>{suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Resume export</h2>
              <p className="mt-2 text-sm text-slate-400">Download or copy your resume, then refine with analysis feedback.</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
              <button type="button" onClick={handleDownloadText} className="inline-flex items-center gap-2 justify-center rounded-2xl bg-teal-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-400">
                <Download className="h-4 w-4" /> TXT
              </button>
              <button type="button" onClick={() => downloadExport('markdown')} className="inline-flex items-center gap-2 justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition hover:bg-white/10">
                <Download className="h-4 w-4" /> MD
              </button>
              <button type="button" onClick={() => downloadExport('html')} className="inline-flex items-center gap-2 justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition hover:bg-white/10">
                <Download className="h-4 w-4" /> HTML
              </button>
              <button type="button" onClick={() => downloadExport('json')} className="inline-flex items-center gap-2 justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition hover:bg-white/10">
                <Download className="h-4 w-4" /> JSON
              </button>
              <button type="button" onClick={() => downloadExport('pdf')} className="inline-flex items-center gap-2 justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition hover:bg-white/10">
                <Download className="h-4 w-4" /> PDF
              </button>
              <button type="button" onClick={() => downloadExport('word')} className="inline-flex items-center gap-2 justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition hover:bg-white/10">
                <Download className="h-4 w-4" /> DOCX
              </button>
            </div>
          </div>
          <div className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-slate-950 p-4">
            <pre className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-200">{resumeText || 'Add your resume details to generate the preview here.'}</pre>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResumeBuilder
