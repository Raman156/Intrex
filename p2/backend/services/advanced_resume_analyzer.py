"""
Advanced Resume Analysis Service
Provides comprehensive resume evaluation with:
- ATS score simulation
- Section-wise scoring (skills, projects, experience, education)
- Grammar and language quality checks
- Multi-role job profile comparison
- Resume improvement suggestions
- Voice feedback capability
"""

import re
import json
from typing import Dict, List, Tuple, Optional
from collections import Counter
import math


class AdvancedResumeAnalyzer:
    """Advanced resume analysis with multiple scoring dimensions"""

    # Job profiles with keywords and requirements
    JOB_PROFILES = {
        'software-engineering': {
            'title': 'Software Engineer',
            'required_skills': ['python', 'java', 'javascript', 'c++', 'sql'],
            'preferred_skills': ['docker', 'kubernetes', 'aws', 'react', 'nodejs', 'api', 'microservices'],
            'experience_keywords': ['developed', 'implemented', 'architected', 'deployed', 'optimized'],
            'ats_keywords': ['software', 'development', 'engineering', 'code', 'programming', 'system', 'design'],
            'project_indicators': ['built', 'created', 'launched', 'product', 'application'],
            'min_years': 0
        },
        'data-science': {
            'title': 'Data Scientist',
            'required_skills': ['python', 'sql', 'machine learning', 'statistics', 'pandas'],
            'preferred_skills': ['tensorflow', 'pytorch', 'spark', 'tableau', 'deep learning', 'nlp'],
            'experience_keywords': ['analyzed', 'predicted', 'trained', 'modeled', 'visualized'],
            'ats_keywords': ['data', 'analysis', 'machine learning', 'model', 'prediction', 'analytics'],
            'project_indicators': ['dataset', 'model', 'analysis', 'prediction', 'insight'],
            'min_years': 0
        },
        'product-management': {
            'title': 'Product Manager',
            'required_skills': ['product strategy', 'roadmap', 'stakeholder', 'agile', 'metrics'],
            'preferred_skills': ['a/b testing', 'user research', 'analytics', 'sql', 'jira'],
            'experience_keywords': ['led', 'managed', 'launched', 'prioritized', 'defined'],
            'ats_keywords': ['product', 'management', 'strategy', 'roadmap', 'feature', 'user'],
            'project_indicators': ['launched', 'increased', 'improved', 'growth', 'revenue'],
            'min_years': 2
        },
        'business-analyst': {
            'title': 'Business Analyst',
            'required_skills': ['requirements', 'analysis', 'sql', 'stakeholder', 'documentation'],
            'preferred_skills': ['tableau', 'power bi', 'bpmn', 'agile', 'jira'],
            'experience_keywords': ['gathered', 'documented', 'analyzed', 'improved', 'streamlined'],
            'ats_keywords': ['business', 'analysis', 'requirements', 'process', 'improvement'],
            'project_indicators': ['workflow', 'process', 'requirement', 'analysis', 'solution'],
            'min_years': 1
        },
        'frontend-developer': {
            'title': 'Frontend Developer',
            'required_skills': ['javascript', 'html', 'css', 'react', 'vue'],
            'preferred_skills': ['typescript', 'angular', 'responsive design', 'api', 'ui/ux'],
            'experience_keywords': ['built', 'designed', 'implemented', 'optimized', 'created'],
            'ats_keywords': ['frontend', 'web development', 'ui', 'javascript', 'responsive'],
            'project_indicators': ['website', 'application', 'interface', 'component', 'design'],
            'min_years': 0
        },
        'devops-engineer': {
            'title': 'DevOps Engineer',
            'required_skills': ['docker', 'kubernetes', 'aws', 'ci/cd', 'linux'],
            'preferred_skills': ['terraform', 'jenkins', 'monitoring', 'git', 'bash'],
            'experience_keywords': ['deployed', 'automated', 'configured', 'managed', 'optimized'],
            'ats_keywords': ['devops', 'infrastructure', 'deployment', 'automation', 'cloud'],
            'project_indicators': ['pipeline', 'infrastructure', 'deployment', 'automation'],
            'min_years': 1
        }
    }

    # Common grammar and language issues
    GRAMMAR_RULES = {
        'tense_inconsistency': {
            'pattern': r'(?:is|are|was|were|have|has|had)\s+\w+(?:ed|ing)',
            'description': 'Inconsistent verb tense',
            'severity': 'medium'
        },
        'repetition': [],  # Will be built dynamically
        'weak_verbs': {
            'list': ['very', 'really', 'actually', 'basically', 'just', 'seemed', 'quite'],
            'description': 'Weak language detected',
            'suggestion': 'Replace with stronger, more action-oriented verbs',
            'severity': 'low'
        },
        'passive_voice': {
            'pattern': r'(?:was|were|be|been)\s+\w+(?:ed|en)',
            'description': 'Passive voice detected',
            'suggestion': 'Use active voice for more impact',
            'severity': 'low'
        },
        'filler_words': {
            'list': ['um', 'uh', 'you know', 'like', 'basically'],
            'description': 'Filler words detected',
            'suggestion': 'Remove filler words for clarity',
            'severity': 'low'
        }
    }

    # Common resume sections
    RESUME_SECTIONS = ['summary', 'objective', 'experience', 'education', 'skills', 'projects',
                       'certifications', 'achievements', 'awards', 'publications', 'volunteer']

    @staticmethod
    def analyze_resume_advanced(text: str, job_profile: str = None) -> Dict:
        """
        Comprehensive resume analysis with multiple scoring dimensions
        
        Args:
            text: Resume text content
            job_profile: Target job profile (optional)
        
        Returns:
            Dict with comprehensive analysis including:
            - overall_score
            - ats_score
            - section_scores (skills, experience, projects, education)
            - grammar_quality
            - multi_role_comparison
            - improvement_suggestions
            - voice_feedback_summary
        """
        text_lower = text.lower()
        
        analysis = {
            'overall_score': 0,
            'ats_score': 0,
            'ats_details': {},
            'section_scores': {},
            'grammar_quality': {},
            'language_quality': {},
            'multi_role_comparison': {},
            'improvement_suggestions': [],
            'strengths': [],
            'voice_feedback_summary': '',
            'metadata': {
                'word_count': len(text.split()),
                'section_count': 0,
                'has_quantified_metrics': False,
                'action_verb_count': 0
            }
        }
        
        # Section-wise analysis
        analysis['section_scores'] = AdvancedResumeAnalyzer._analyze_sections(text, text_lower)
        analysis['metadata']['section_count'] = len([s for s in analysis['section_scores'].values() if s['score'] > 0])
        
        # Grammar and language quality
        analysis['grammar_quality'] = AdvancedResumeAnalyzer._check_grammar_and_language(text, text_lower)
        analysis['language_quality'] = AdvancedResumeAnalyzer._analyze_language_quality(text, text_lower)
        
        # ATS score simulation
        analysis['ats_score'], analysis['ats_details'] = AdvancedResumeAnalyzer._calculate_ats_score(text, text_lower, job_profile)
        
        # Multi-role comparison
        analysis['multi_role_comparison'] = AdvancedResumeAnalyzer._compare_all_job_profiles(text, text_lower)
        
        # Metadata
        analysis['metadata']['has_quantified_metrics'] = bool(re.search(r'\d+%|\$\d+|[\d,]+\s*(users|customers|revenue|growth)', text))
        analysis['metadata']['action_verb_count'] = AdvancedResumeAnalyzer._count_action_verbs(text_lower)
        
        # Calculate overall score (weighted average)
        section_avg = sum(s['score'] for s in analysis['section_scores'].values()) / len(analysis['section_scores']) \
            if analysis['section_scores'] else 0
        grammar_score = analysis['grammar_quality']['overall_score']
        ats_score = analysis['ats_score']
        language_score = analysis['language_quality']['overall_score']
        
        analysis['overall_score'] = int(
            section_avg * 0.30 +
            ats_score * 0.35 +
            grammar_score * 0.20 +
            language_score * 0.15
        )
        
        # Generate improvement suggestions
        analysis['improvement_suggestions'] = AdvancedResumeAnalyzer._generate_suggestions(analysis, text_lower)
        analysis['strengths'] = AdvancedResumeAnalyzer._identify_strengths(analysis, text_lower)
        
        # Generate voice feedback summary
        analysis['voice_feedback_summary'] = AdvancedResumeAnalyzer._generate_voice_feedback(analysis)
        
        return analysis

    @staticmethod
    def _analyze_sections(text: str, text_lower: str) -> Dict[str, Dict]:
        """Analyze resume sections individually"""
        sections = {}
        
        # Experience section
        exp_score = AdvancedResumeAnalyzer._score_experience_section(text, text_lower)
        sections['experience'] = {
            'score': exp_score,
            'found': 'experience' in text_lower or 'employment' in text_lower,
            'feedback': 'Strong work history with measurable impact' if exp_score > 80 else 'Could strengthen with more specific achievements'
        }
        
        # Skills section
        skills_score = AdvancedResumeAnalyzer._score_skills_section(text_lower)
        sections['skills'] = {
            'score': skills_score,
            'found': 'skill' in text_lower or 'technical' in text_lower,
            'feedback': 'Well-organized skills section' if skills_score > 75 else 'Add more technical skills and proficiency levels'
        }
        
        # Projects section
        projects_score = AdvancedResumeAnalyzer._score_projects_section(text, text_lower)
        sections['projects'] = {
            'score': projects_score,
            'found': 'project' in text_lower,
            'feedback': 'Strong project showcase' if projects_score > 70 else 'Add project descriptions with technologies and outcomes'
        }
        
        # Education section
        edu_score = AdvancedResumeAnalyzer._score_education_section(text, text_lower)
        sections['education'] = {
            'score': edu_score,
            'found': 'education' in text_lower or 'degree' in text_lower,
            'feedback': 'Complete education information' if edu_score > 75 else 'Add GPA or relevant coursework'
        }
        
        return sections

    @staticmethod
    def _score_experience_section(text: str, text_lower: str) -> int:
        """Score the experience/work history section"""
        score = 50
        
        # Check for date ranges
        date_ranges = len(re.findall(r'\b(19|20)\d{2}\s*[-–—]\s*((19|20)\d{2}|present|current)\b', text_lower))
        score += min(25, date_ranges * 5)
        
        # Check for action verbs
        action_verbs = [
            'developed', 'created', 'managed', 'led', 'implemented', 'designed',
            'built', 'improved', 'increased', 'reduced', 'achieved', 'delivered',
            'launched', 'optimized', 'collaborated', 'coordinated', 'spearheaded',
            'pioneered', 'transformed', 'accelerated', 'streamlined'
        ]
        verb_count = sum(1 for verb in action_verbs if verb in text_lower)
        score += min(15, verb_count * 2)
        
        # Check for job titles/companies
        has_titles = len(re.findall(r'\b(?:engineer|manager|developer|analyst|specialist|director)\b', text_lower)) > 0
        if has_titles:
            score += 5
        
        # Check for quantifiable metrics
        has_metrics = bool(re.search(r'\d+%|\$\d+|[\d,]+\s*(users|customers|revenue|growth|increase|decrease)', text_lower))
        if has_metrics:
            score += 5
        
        return min(100, score)

    @staticmethod
    def _score_skills_section(text_lower: str) -> int:
        """Score the skills section"""
        score = 50
        
        # Check for technical skills variety
        tech_categories = [
            'programming language',
            'framework', 'database', 'tool', 'platform', 'library',
            'python', 'java', 'javascript', 'react', 'node', 'sql', 'git',
            'aws', 'docker', 'kubernetes', 'api', 'rest', 'graphql'
        ]
        matched_categories = sum(1 for cat in tech_categories if cat in text_lower)
        score += min(30, matched_categories * 2)
        
        # Check for skill organization
        skill_pattern = r'(?:skills?|technical|expertise|competencies).*?(?=\n\n|\n[A-Z]|\Z)'
        if re.search(skill_pattern, text_lower, re.DOTALL):
            score += 10
        
        # Check for proficiency levels
        if any(level in text_lower for level in ['advanced', 'intermediate', 'beginner', 'expert', 'proficient']):
            score += 10
        
        return min(100, score)

    @staticmethod
    def _score_projects_section(text: str, text_lower: str) -> int:
        """Score the projects section"""
        score = 0  # Start at 0 - projects are optional
        
        if 'project' not in text_lower:
            return score
        
        score = 40  # Base score for having projects
        
        # Count projects
        project_count = len(re.findall(r'(?:project|side[\s-]?project|personal[\s-]?project)', text_lower))
        score += min(20, min(project_count * 5, 20))
        
        # Check for technology mentions in projects
        tech_keywords = ['python', 'javascript', 'react', 'node', 'sql', 'api', 'database', 'docker', 'aws']
        tech_count = sum(1 for tech in tech_keywords if tech in text_lower)
        score += min(15, tech_count)
        
        # Check for project outcomes/metrics
        if any(metric in text_lower for metric in ['users', 'downloads', 'stars', 'improvement', 'increase']):
            score += 15
        
        # Check for GitHub or portfolio links
        if 'github' in text_lower or 'portfolio' in text_lower or 'github.com' in text:
            score += 10
        
        return min(100, score)

    @staticmethod
    def _score_education_section(text: str, text_lower: str) -> int:
        """Score the education section"""
        score = 50
        
        # Check for degree mentions
        degrees = ['bachelor', 'master', 'phd', 'b.s.', 'm.s.', 'b.a.', 'm.a.', 'bs', 'ms', 'phd', 'associate']
        if any(deg in text_lower for deg in degrees):
            score += 20
        
        # Check for university/college name
        if any(word in text_lower for word in ['university', 'college', 'institute']):
            score += 10
        
        # Check for GPA
        if re.search(r'gpa[\s:]*[\d.]+', text_lower):
            score += 10
        
        # Check for relevant coursework
        if any(word in text_lower for word in ['coursework', 'course', 'relevant courses']):
            score += 5
        
        # Check for graduation year
        if re.search(r'\b(19|20)\d{2}\b', text):
            score += 5
        
        return min(100, score)

    @staticmethod
    def _check_grammar_and_language(text: str, text_lower: str) -> Dict:
        """Check grammar and language quality"""
        issues = []
        score = 100
        
        # Check for common grammar issues
        
        # Passive voice detection
        passive_matches = len(re.findall(r'\b(?:was|were|been|be)\s+\w+(?:ed|en)\b', text_lower))
        if passive_matches > 3:
            issues.append({
                'type': 'passive_voice',
                'count': passive_matches,
                'severity': 'low',
                'suggestion': 'Use more active voice'
            })
            score -= passive_matches * 2
        
        # Weak/filler words
        weak_words = ['very', 'really', 'actually', 'basically', 'just', 'quite', 'seem']
        weak_count = sum(1 for word in weak_words if f' {word} ' in f' {text_lower} ')
        if weak_count > 2:
            issues.append({
                'type': 'weak_words',
                'count': weak_count,
                'severity': 'low',
                'suggestion': 'Replace with stronger language'
            })
            score -= weak_count
        
        # Capitalization issues
        allcaps = len(re.findall(r'\b[A-Z]{2,}\b', text))
        if allcaps > 10:
            issues.append({
                'type': 'excessive_caps',
                'count': allcaps,
                'severity': 'medium',
                'suggestion': 'Reduce excessive capitalization'
            })
            score -= 5
        
        # Punctuation issues
        if text.count('!!!') or text.count('???'):
            issues.append({
                'type': 'excessive_punctuation',
                'severity': 'medium',
                'suggestion': 'Reduce excessive punctuation marks'
            })
            score -= 3
        
        # Spelling approximation (words that might be misspelled)
        common_misspellings = {
            'occured': 'occurred',
            'seperate': 'separate',
            'recieve': 'receive',
            'wich': 'which',
            'acheive': 'achieve'
        }
        misspelling_count = sum(1 for misspelling in common_misspellings if misspelling in text_lower)
        if misspelling_count > 0:
            issues.append({
                'type': 'misspelling',
                'count': misspelling_count,
                'severity': 'high',
                'suggestion': 'Fix spelling errors'
            })
            score -= misspelling_count * 5
        
        return {
            'overall_score': max(0, score),
            'total_issues': len(issues),
            'issues': issues[:5]  # Top 5 issues
        }

    @staticmethod
    def _analyze_language_quality(text: str, text_lower: str) -> Dict:
        """Analyze language quality and professionalism"""
        score = 80
        issues = []
        
        # Check professional tone
        unprofessional_words = ['gonna', 'wanna', 'kinda', 'sorta', 'btw', 'lol', 'omg']
        unprofessional_count = sum(1 for word in unprofessional_words if word in text_lower)
        if unprofessional_count > 0:
            issues.append('Unprofessional language detected')
            score -= unprofessional_count * 5
        
        # Check for conciseness
        sentences = re.split(r'[.!?]', text)
        avg_sentence_length = sum(len(s.split()) for s in sentences) / len(sentences) if sentences else 0
        if avg_sentence_length > 30:
            issues.append('Sentences are too long - improve clarity')
            score -= 5
        elif avg_sentence_length < 5:
            issues.append('Sentences are too short - improve flow')
            score -= 3
        
        # Check readability (Flesch Kincaid approximation)
        words = len(text.split())
        sentences_count = len(sentences)
        syllables = sum(text.count(vowel) for vowel in 'aeiouy') if words > 0 else 0
        
        if words > 0 and sentences_count > 0:
            flesch_kincaid = 0.39 * (words / sentences_count) + 11.8 * (syllables / words) - 15.59
            if flesch_kincaid > 15:  # Too complex
                issues.append('Complex language - simplify for readability')
                score -= 5
        
        # Check for specific metrics and accomplishments
        if not any(indicator in text_lower for indicator in ['improved', 'increased', 'achieved', 'reduced']):
            issues.append('Add more specific metrics and accomplishments')
            score -= 5
        
        # Check for varied sentence structure
        starts_with = Counter()
        for sentence in sentences:
            first_word = sentence.strip().split()[0].lower() if sentence.strip() else ''
            starts_with[first_word] += 1
        
        if starts_with and max(starts_with.values()) > len(sentences) * 0.3:
            issues.append('Sentence structure is repetitive')
            score -= 3
        
        return {
            'overall_score': max(0, score),
            'avg_sentence_length': round(avg_sentence_length, 1),
            'issues': issues[:3]
        }

    @staticmethod
    def _calculate_ats_score(text: str, text_lower: str, job_profile: str = None) -> Tuple[int, Dict]:
        """
        Simulate ATS (Applicant Tracking System) score
        
        ATS typically scans for:
        - Keywords matching job description
        - Proper formatting
        - Contact information
        - Education
        - Employment history
        """
        score = 0
        details = {
            'keyword_match': 0,
            'formatting': 0,
            'contact_info': 0,
            'education': 0,
            'experience': 0,
            'skills': 0,
            'metrics': 0
        }
        
        # Contact Information (10 points)
        has_email = bool(re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text))
        has_phone = bool(re.search(r'\b(\d{3}[-.]?\d{3}[-.]?\d{4}|\+?1?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})\b', text))
        has_linkedin = 'linkedin.com' in text_lower or 'linkedin' in text_lower
        
        contact_score = (int(has_email) * 4 + int(has_phone) * 4 + int(has_linkedin) * 2)
        details['contact_info'] = contact_score
        score += contact_score
        
        # Education (10 points)
        edu_score = 0
        degrees = ['bachelor', 'master', 'phd', 'b.s.', 'm.s.', 'bs', 'ms']
        if any(deg in text_lower for deg in degrees):
            edu_score += 5
        if 'university' in text_lower or 'college' in text_lower:
            edu_score += 5
        details['education'] = edu_score
        score += edu_score
        
        # Experience (15 points)
        exp_score = 0
        date_ranges = len(re.findall(r'\b(19|20)\d{2}\s*[-–—]\s*((19|20)\d{2}|present|current)\b', text_lower))
        exp_score = min(10, date_ranges * 3)
        
        # Job titles
        job_titles = ['engineer', 'developer', 'manager', 'analyst', 'specialist', 'architect', 'lead']
        if sum(1 for title in job_titles if title in text_lower) > 0:
            exp_score += 5
        
        details['experience'] = exp_score
        score += exp_score
        
        # Skills (20 points)
        technical_skills = [
            'python', 'java', 'javascript', 'sql', 'react', 'node', 'docker',
            'aws', 'api', 'rest', 'database', 'git', 'linux', 'agile'
        ]
        skills_found = sum(1 for skill in technical_skills if skill in text_lower)
        skills_score = min(20, skills_found * 1.5)
        details['skills'] = skills_score
        score += skills_score
        
        # Keywords based on job profile (30 points)
        keyword_score = 0
        if job_profile and job_profile in AdvancedResumeAnalyzer.JOB_PROFILES:
            profile = AdvancedResumeAnalyzer.JOB_PROFILES[job_profile]
            
            # Check required skills
            required_matches = sum(1 for skill in profile['required_skills'] if skill in text_lower)
            keyword_score += min(10, required_matches * 2)
            
            # Check preferred skills
            preferred_matches = sum(1 for skill in profile['preferred_skills'] if skill in text_lower)
            keyword_score += min(10, preferred_matches)
            
            # Check ATS keywords
            ats_matches = sum(1 for keyword in profile['ats_keywords'] if keyword in text_lower)
            keyword_score += min(10, ats_matches)
        else:
            # Generic keyword scoring
            generic_keywords = [
                'experience', 'expertise', 'skills', 'education', 'achievement',
                'responsibility', 'project', 'developed', 'managed', 'led'
            ]
            generic_matches = sum(1 for keyword in generic_keywords if keyword in text_lower)
            keyword_score = min(30, generic_matches * 2)
        
        details['keyword_match'] = keyword_score
        score += keyword_score
        
        # Formatting (10 points)
        formatting_score = 0
        # Check for section headers
        headers = len(re.findall(r'\b[A-Z][A-Z\s]{3,}\b', text))
        if headers >= 3:
            formatting_score += 5
        
        # Check for bullet points
        if '•' in text or '·' in text or re.search(r'^\s*[-*]\s', text, re.MULTILINE):
            formatting_score += 5
        
        details['formatting'] = formatting_score
        score += formatting_score
        
        # Quantifiable Metrics (5 points)
        has_metrics = bool(re.search(r'\d+%|\$[\d.]+[kK]?|[\d,]+\s*(users|customers|revenue|growth)', text_lower))
        if has_metrics:
            details['metrics'] = 5
            score += 5
        
        return min(100, score), details

    @staticmethod
    def _compare_all_job_profiles(text: str, text_lower: str) -> Dict:
        """Compare resume against multiple job profiles"""
        profile_matches = {}
        
        for profile_key, profile_data in AdvancedResumeAnalyzer.JOB_PROFILES.items():
            # Calculate match score
            required_matches = sum(1 for skill in profile_data['required_skills'] if skill in text_lower)
            preferred_matches = sum(1 for skill in profile_data['preferred_skills'] if skill in text_lower)
            experience_matches = sum(1 for keyword in profile_data['experience_keywords'] if keyword in text_lower)
            ats_matches = sum(1 for keyword in profile_data['ats_keywords'] if keyword in text_lower)
            
            # Score calculation
            match_score = (
                required_matches * 5 +
                preferred_matches * 3 +
                experience_matches * 2 +
                ats_matches * 1
            )
            
            # Normalize to 0-100
            max_possible = (
                len(profile_data['required_skills']) * 5 +
                len(profile_data['preferred_skills']) * 3 +
                len(profile_data['experience_keywords']) * 2 +
                len(profile_data['ats_keywords']) * 1
            )
            
            normalized_score = int((match_score / max_possible * 100)) if max_possible > 0 else 0
            
            profile_matches[profile_key] = {
                'job_title': profile_data['title'],
                'match_percentage': normalized_score,
                'required_skills_found': required_matches,
                'required_skills_total': len(profile_data['required_skills']),
                'preferred_skills_found': preferred_matches,
                'recommended': normalized_score >= 60
            }
        
        # Sort by match percentage
        sorted_profiles = dict(sorted(
            profile_matches.items(),
            key=lambda x: x[1]['match_percentage'],
            reverse=True
        ))
        
        return sorted_profiles

    @staticmethod
    def _count_action_verbs(text_lower: str) -> int:
        """Count action verbs in the resume"""
        action_verbs = [
            'developed', 'created', 'managed', 'led', 'implemented', 'designed',
            'built', 'improved', 'increased', 'reduced', 'achieved', 'delivered',
            'launched', 'optimized', 'collaborated', 'coordinated', 'spearheaded',
            'pioneered', 'transformed', 'accelerated', 'streamlined', 'analyzed',
            'established', 'controlled', 'conducted', 'directed', 'executed'
        ]
        return sum(1 for verb in action_verbs if verb in text_lower)

    @staticmethod
    def _generate_suggestions(analysis: Dict, text_lower: str) -> List[str]:
        """Generate specific improvement suggestions"""
        suggestions = []
        
        # Section-specific suggestions
        for section, scores in analysis['section_scores'].items():
            if scores['score'] < 50:
                if section == 'experience' and scores['score'] < 50:
                    suggestions.append('Add more quantifiable results to your experience (e.g., "increased revenue by 25%")')
                elif section == 'skills' and scores['score'] < 50:
                    suggestions.append('Expand your skills section - include proficiency levels and categories')
                elif section == 'projects' and scores['score'] == 0:
                    suggestions.append('Add a projects section to showcase your practical experience')
                elif section == 'education' and scores['score'] < 50:
                    suggestions.append('Complete your education section with GPA or relevant coursework')
        
        # Grammar suggestions
        if analysis['grammar_quality']['total_issues'] > 2:
            suggestions.append('Fix grammar and spelling issues throughout the resume')
        
        # ATS suggestions
        if analysis['ats_score'] < 60:
            suggestions.append('Improve ATS compatibility by including more industry keywords')
            if not analysis['metadata']['has_quantified_metrics']:
                suggestions.append('Include measurable metrics and achievements (e.g., percentages, numbers)')
        
        # Language quality suggestions
        if analysis['language_quality']['avg_sentence_length'] > 25:
            suggestions.append('Break down long sentences for improved readability')
        
        # If not comparing to profile, make generic suggestions
        if analysis['metadata']['action_verb_count'] < 5:
            suggestions.append('Use more action verbs to describe your achievements')
        
        # Contact information
        if '@ ' not in text_lower and '@' not in text_lower:
            suggestions.append('Ensure your email address is clearly visible')
        
        return suggestions[:5]  # Top 5 suggestions

    @staticmethod
    def _identify_strengths(analysis: Dict, text_lower: str) -> List[str]:
        """Identify resume strengths"""
        strengths = []
        
        # High-scoring sections
        for section, scores in analysis['section_scores'].items():
            if scores['score'] >= 80:
                strengths.append(f"Strong {section} section with clear details")
        
        # ATS strengths
        if analysis['ats_score'] >= 80:
            strengths.append("Excellent ATS compatibility and keyword optimization")
        
        # Grammar strengths
        if analysis['grammar_quality']['overall_score'] >= 90:
            strengths.append("Well-written with minimal grammar issues")
        
        # Language strengths
        if analysis['language_quality']['overall_score'] >= 85:
            strengths.append("Professional tone and clear communication")
        
        # Metadata strengths
        if analysis['metadata']['has_quantified_metrics']:
            strengths.append("Good use of metrics and quantifiable results")
        
        if analysis['metadata']['action_verb_count'] >= 5:
            strengths.append("Effective use of action verbs throughout")
        
        return strengths[:4]

    @staticmethod
    def _generate_voice_feedback(analysis: Dict) -> str:
        """Generate a voice-friendly text summary of the resume analysis"""
        score = analysis['overall_score']
        
        # Determine performance level
        if score >= 85:
            performance = "excellent"
        elif score >= 70:
            performance = "good"
        elif score >= 60:
            performance = "satisfactory"
        else:
            performance = "needs improvement"
        
        feedback = f"Your resume has an overall score of {score} out of 100, which is {performance}. "
        
        # Add section highlights
        best_section = max(analysis['section_scores'].items(), key=lambda x: x[1]['score'])
        feedback += f"Your {best_section[0]} section is particularly strong. "
        
        worst_section = min(analysis['section_scores'].items(), key=lambda x: x[1]['score'])
        if worst_section[1]['score'] < 60:
            feedback += f"Focus on improving your {worst_section[0]} section. "
        
        # Add ATS feedback
        feedback += f"Your ATS compatibility score is {analysis['ats_score']}. "
        
        # Add top suggestions
        if analysis['improvement_suggestions']:
            feedback += f"Consider: {analysis['improvement_suggestions'][0]}. "
        
        # Add strengths
        if analysis['strengths']:
            feedback += f"Your main strength is having {analysis['strengths'][0].lower()}. "
        
        feedback += "Keep refining your resume to better match your target roles."
        
        return feedback

    @staticmethod
    def compare_resume_with_job_description(resume_text: str, job_description: str) -> Dict:
        """
        Compare resume with a specific job description
        
        Args:
            resume_text: Resume content
            job_description: Job description text
        
        Returns:
            Dict with comparison results including gap analysis
        """
        resume_lower = resume_text.lower()
        job_lower = job_description.lower()
        
        # Extract keywords from job description
        job_keywords = set(re.findall(r'\b[a-z]+\b', job_lower))
        job_keywords = {kw for kw in job_keywords if len(kw) > 4}  # Filter short words
        
        # Find matching keywords
        matched_keywords = []
        missing_keywords = []
        
        for keyword in job_keywords:
            if keyword in resume_lower:
                matched_keywords.append(keyword)
            elif keyword in ['required', 'years', 'experience', 'skills', 'skills ']:
                missing_keywords.append(keyword)
        
        match_percentage = int((len(matched_keywords) / len(job_keywords) * 100)) if job_keywords else 0
        
        return {
            'match_percentage': match_percentage,
            'matched_keywords': matched_keywords[:20],
            'missing_keywords': missing_keywords[:10],
            'recommendation': 'Good fit - apply now!' if match_percentage >= 75 else 'Consider tailoring your resume'
        }


# Voice feedback integration (would be used with TTS)
class VoiceFeedbackFormatter:
    """Format analysis results for text-to-speech output"""
    
    @staticmethod
    def format_for_voice(analysis: Dict) -> Dict:
        """Format analysis for voice output (TTS-friendly)"""
        return {
            'summary': analysis['voice_feedback_summary'],
            'score_description': f"Overall score: {analysis['overall_score']} out of 100",
            'ats_description': f"ATS score: {analysis['ats_score']} out of 100",
            'top_suggestion': analysis['improvement_suggestions'][0] if analysis['improvement_suggestions'] else 'Great resume!',
            'main_strength': analysis['strengths'][0] if analysis['strengths'] else 'Good professional background',
        }
