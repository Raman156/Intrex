"""
Resume validation and analysis service
"""
import re
from typing import Dict, Tuple


class ResumeAnalyzer:
    """Analyzes and validates resume content"""
    
    # Common resume section keywords
    RESUME_KEYWORDS = [
        'experience', 'education', 'skills', 'projects', 'work history',
        'employment', 'qualifications', 'certifications', 'achievements',
        'professional summary', 'objective', 'career', 'responsibilities',
        'accomplishments', 'technical skills', 'soft skills', 'languages',
        'awards', 'publications', 'volunteer', 'internship', 'training'
    ]
    
    # Keywords that indicate non-resume documents
    NON_RESUME_KEYWORDS = [
        'syllabus', 'course outline', 'lecture', 'assignment', 'homework',
        'exam', 'quiz', 'chapter', 'textbook', 'curriculum', 'semester',
        'grade', 'student', 'professor', 'instructor', 'class schedule',
        'learning objectives', 'course description', 'prerequisites',
        'office hours', 'attendance policy', 'grading policy'
    ]
    
    @staticmethod
    def is_valid_resume(text: str) -> Tuple[bool, str]:
        """
        Validates if the document is actually a resume/CV
        
        Returns:
            Tuple[bool, str]: (is_valid, error_message)
        """
        if not text or len(text.strip()) < 100:
            return False, "Document is too short to be a valid resume"
        
        text_lower = text.lower()
        
        # Check for non-resume keywords (syllabus, course materials, etc.)
        non_resume_count = sum(1 for keyword in ResumeAnalyzer.NON_RESUME_KEYWORDS 
                               if keyword in text_lower)
        
        if non_resume_count >= 3:
            return False, "This appears to be a syllabus or course document, not a resume. Please upload a valid resume or CV."
        
        # Check for resume keywords
        resume_keyword_count = sum(1 for keyword in ResumeAnalyzer.RESUME_KEYWORDS 
                                   if keyword in text_lower)
        
        if resume_keyword_count < 3:
            return False, "This document doesn't appear to be a resume. Please upload a valid resume or CV containing sections like Experience, Skills, and Education."
        
        # Check for common resume patterns
        has_email = bool(re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text))
        has_phone = bool(re.search(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', text))
        has_date_ranges = bool(re.search(r'\b(19|20)\d{2}\s*[-–—]\s*((19|20)\d{2}|present|current)\b', text_lower))
        
        # At least 2 of these patterns should be present
        pattern_count = sum([has_email, has_phone, has_date_ranges])
        
        if pattern_count < 1:
            return False, "This document doesn't contain typical resume elements (contact info, dates, etc.). Please upload a valid resume."
        
        return True, ""
    
    @staticmethod
    def analyze_resume(text: str, selected_field: str = None) -> Dict:
        """
        Analyzes resume content and generates a quality score
        
        Args:
            text: Resume text content
            selected_field: The field/role selected by user (e.g., 'software-engineering')
        
        Returns:
            Dict with scores and analysis
        """
        text_lower = text.lower()
        
        # Structure score - check for key sections
        structure_score = 0
        required_sections = ['experience', 'education', 'skills']
        optional_sections = ['projects', 'certifications', 'achievements', 'summary']
        
        for section in required_sections:
            if section in text_lower:
                structure_score += 25
        
        for section in optional_sections:
            if section in text_lower:
                structure_score += 6.25
        
        structure_score = min(100, structure_score)
        
        # Skills relevance score based on field
        skills_score, matched_skills = ResumeAnalyzer._calculate_skills_score(text_lower, selected_field)
        
        # Experience quality score
        experience_score = ResumeAnalyzer._calculate_experience_score(text)
        
        # Keywords/ATS score
        keywords_score = ResumeAnalyzer._calculate_keywords_score(text_lower, selected_field)
        
        # Field-specific analysis
        field_insights = ResumeAnalyzer._get_field_insights(text_lower, selected_field, matched_skills)
        
        # Overall score (weighted average)
        overall_score = int(
            structure_score * 0.25 +
            skills_score * 0.30 +
            experience_score * 0.25 +
            keywords_score * 0.20
        )
        
        return {
            'overall': overall_score,
            'structure': int(structure_score),
            'skills': int(skills_score),
            'experience': int(experience_score),
            'keywords': int(keywords_score),
            'has_contact': bool(re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text)),
            'has_projects': 'project' in text_lower,
            'has_certifications': 'certification' in text_lower or 'certificate' in text_lower,
            'word_count': len(text.split()),
            'field_specific': field_insights,
            'ats_score': ResumeAnalyzer._calculate_ats_score(overall_score, field_insights),
            'skill_impact': ResumeAnalyzer._calculate_skill_impact(field_insights),
        }
    
    @staticmethod
    def _calculate_skills_score(text: str, field: str) -> tuple[float, list]:
        """
        Calculate skills relevance score based on field
        Returns: (score, list of matched skills)
        """
        field_keywords = {
            'software-engineering': [
                'python', 'java', 'javascript', 'react', 'node', 'sql', 'git',
                'api', 'database', 'algorithm', 'data structure', 'oop', 'agile',
                'docker', 'kubernetes', 'aws', 'cloud', 'microservices', 'rest',
                'typescript', 'angular', 'vue', 'spring', 'django', 'flask',
                'mongodb', 'postgresql', 'redis', 'graphql', 'ci/cd', 'jenkins',
                'terraform', 'linux', 'bash', 'testing', 'tdd', 'design patterns'
            ],
            'data-science': [
                'python', 'r', 'machine learning', 'deep learning', 'tensorflow',
                'pytorch', 'pandas', 'numpy', 'scikit-learn', 'sql', 'statistics',
                'data analysis', 'visualization', 'tableau', 'power bi', 'jupyter',
                'neural network', 'nlp', 'computer vision', 'model', 'keras',
                'spark', 'hadoop', 'big data', 'feature engineering', 'regression',
                'classification', 'clustering', 'time series', 'a/b testing',
                'matplotlib', 'seaborn', 'data mining', 'predictive modeling'
            ],
            'product-management': [
                'product strategy', 'roadmap', 'agile', 'scrum', 'stakeholder',
                'user research', 'analytics', 'metrics', 'kpi', 'a/b testing',
                'wireframe', 'prototype', 'jira', 'confluence', 'prioritization',
                'market research', 'competitive analysis', 'user story', 'mvp',
                'product lifecycle', 'go-to-market', 'user experience', 'ux',
                'product vision', 'okr', 'customer feedback', 'feature definition',
                'product launch', 'cross-functional', 'data-driven', 'sql'
            ],
            'business-analyst': [
                'requirements', 'business process', 'stakeholder', 'analysis',
                'documentation', 'sql', 'excel', 'data analysis', 'reporting',
                'process improvement', 'workflow', 'uml', 'use case', 'gap analysis',
                'business intelligence', 'tableau', 'power bi', 'agile', 'scrum',
                'bpmn', 'visio', 'requirements gathering', 'user stories',
                'acceptance criteria', 'process mapping', 'data modeling',
                'kpi', 'metrics', 'dashboard', 'stakeholder management'
            ]
        }
        
        if not field or field not in field_keywords:
            # Generic skills check — scan for common tech skills
            generic_tech = [
                'python', 'javascript', 'java', 'react', 'node', 'sql', 'git',
                'html', 'css', 'typescript', 'docker', 'aws', 'linux', 'api',
                'mongodb', 'postgresql', 'django', 'flask', 'fastapi', 'spring',
                'machine learning', 'tensorflow', 'pytorch', 'pandas', 'numpy',
                'agile', 'scrum', 'jira', 'figma', 'kubernetes', 'ci/cd',
                'communication', 'leadership', 'teamwork', 'problem solving'
            ]
            matches = [skill for skill in generic_tech if skill in text]
            score = min(100, 50 + (len(matches) * 3))
            return score, matches
        
        # Field-specific skills check
        relevant_keywords = field_keywords[field]
        matched_skills = [keyword for keyword in relevant_keywords if keyword in text]
        match_count = len(matched_skills)
        
        # STRICTER scoring - penalize low matches more heavily
        # A CSE resume should score low for Business Analyst
        if match_count >= 15:
            score = 90 + min(10, match_count - 15)
        elif match_count >= 12:
            score = 85 + (match_count - 12) * 1.5
        elif match_count >= 9:
            score = 75 + (match_count - 9) * 3
        elif match_count >= 6:
            score = 60 + (match_count - 6) * 5
        elif match_count >= 4:
            score = 45 + (match_count - 4) * 7.5
        elif match_count >= 2:
            score = 30 + (match_count - 2) * 7.5
        else:
            score = match_count * 15  # Very low score for 0-1 matches
        
        return min(100, score), matched_skills
    
    @staticmethod
    def _get_field_insights(text: str, field: str, matched_skills: list) -> Dict:
        """Generate field-specific insights and recommendations"""
        
        if not field:
            return {
                'matched_skills': matched_skills[:10] if matched_skills else [],
                'matched_count': len(matched_skills) if matched_skills else 0,
                'missing_critical': [],
                'matched_advanced': [],
                'missing_advanced': [],
                'strengths': ['General professional experience'],
                'recommendations': ['Consider adding more specific technical skills'],
                'has_quantifiable_impact': False
            }
        
        # Field-specific critical skills
        critical_skills = {
            'software-engineering': {
                'must_have': ['python', 'java', 'javascript', 'sql', 'git'],
                'nice_to_have': ['docker', 'kubernetes', 'aws', 'react', 'api'],
                'strengths_indicators': ['algorithm', 'system design', 'microservices', 'ci/cd'],
                'project_keywords': ['built', 'developed', 'implemented', 'architected', 'optimized']
            },
            'data-science': {
                'must_have': ['python', 'sql', 'machine learning', 'statistics', 'pandas'],
                'nice_to_have': ['tensorflow', 'pytorch', 'spark', 'tableau', 'deep learning'],
                'strengths_indicators': ['model', 'prediction', 'analysis', 'visualization', 'feature engineering'],
                'project_keywords': ['analyzed', 'predicted', 'trained', 'deployed', 'improved accuracy']
            },
            'product-management': {
                'must_have': ['product strategy', 'roadmap', 'stakeholder', 'agile', 'metrics'],
                'nice_to_have': ['a/b testing', 'user research', 'analytics', 'jira', 'sql'],
                'strengths_indicators': ['launched', 'prioritization', 'user experience', 'kpi', 'go-to-market'],
                'project_keywords': ['launched', 'defined', 'prioritized', 'led', 'increased']
            },
            'business-analyst': {
                'must_have': ['requirements', 'analysis', 'sql', 'stakeholder', 'documentation'],
                'nice_to_have': ['tableau', 'power bi', 'bpmn', 'agile', 'process improvement'],
                'strengths_indicators': ['gap analysis', 'process mapping', 'business intelligence', 'reporting'],
                'project_keywords': ['gathered', 'documented', 'analyzed', 'improved', 'streamlined']
            }
        }
        
        if field not in critical_skills:
            return {
                'matched_skills': matched_skills[:10] if matched_skills else [],
                'matched_count': len(matched_skills) if matched_skills else 0,
                'missing_critical': [],
                'matched_advanced': [],
                'missing_advanced': [],
                'strengths': [],
                'recommendations': ['Select a specific field for detailed analysis'],
                'has_quantifiable_impact': False
            }
        
        field_data = critical_skills[field]
        
        # Check for must-have skills
        missing_must_have = [skill for skill in field_data['must_have'] if skill not in matched_skills]
        
        # Check for nice-to-have skills
        matched_nice_to_have = [skill for skill in field_data['nice_to_have'] if skill in matched_skills]
        missing_nice_to_have = [skill for skill in field_data['nice_to_have'] if skill not in matched_skills]
        
        # Identify strengths
        strengths = []
        for indicator in field_data['strengths_indicators']:
            if indicator in text:
                strengths.append(indicator)
        
        # Check for project keywords
        has_strong_verbs = sum(1 for keyword in field_data['project_keywords'] if keyword in text)
        
        # Generate recommendations
        recommendations = []
        if missing_must_have:
            recommendations.append(f"Add critical skills: {', '.join(missing_must_have[:3])}")
        if has_strong_verbs < 3:
            recommendations.append("Use more action verbs to describe achievements")
        if not strengths:
            recommendations.append(f"Highlight {field.replace('-', ' ')} specific accomplishments")
        if len(matched_skills) < 5:
            recommendations.append(f"Include more {field.replace('-', ' ')} relevant skills")
        
        # Field-specific recommendations
        if field == 'software-engineering':
            if 'github' not in text and 'portfolio' not in text:
                recommendations.append("Consider adding GitHub profile or portfolio link")
            if 'open source' not in text:
                recommendations.append("Mention open source contributions if applicable")
        elif field == 'data-science':
            if 'kaggle' not in text and 'portfolio' not in text:
                recommendations.append("Consider adding Kaggle profile or data portfolio")
            if not any(word in text for word in ['accuracy', 'precision', 'recall', 'rmse']):
                recommendations.append("Include model performance metrics in project descriptions")
        elif field == 'product-management':
            if not any(word in text for word in ['revenue', 'growth', 'users', 'adoption']):
                recommendations.append("Quantify product impact with metrics (users, revenue, growth)")
            if 'user interview' not in text and 'user research' not in text:
                recommendations.append("Highlight user research and customer interaction experience")
        elif field == 'business-analyst':
            if not any(word in text for word in ['cost savings', 'efficiency', 'roi']):
                recommendations.append("Quantify business impact (cost savings, efficiency gains)")
            if 'dashboard' not in text and 'report' not in text:
                recommendations.append("Mention experience with dashboards and reporting")
        
        return {
            'matched_skills': matched_skills[:15],  # Top 15 matched skills
            'matched_count': len(matched_skills),
            'missing_critical': missing_must_have,
            'matched_advanced': matched_nice_to_have,
            'missing_advanced': missing_nice_to_have[:5],  # Top 5 missing
            'strengths': strengths[:5],  # Top 5 strengths
            'recommendations': recommendations[:4],  # Top 4 recommendations
            'has_quantifiable_impact': has_strong_verbs >= 3
        }
    
    @staticmethod
    def _calculate_ats_score(overall_score: int, field_insights: dict) -> int:
        """
        Derive an ATS compatibility score.
        ATS cares about: keyword density, missing critical skills, formatting signals.
        """
        base = overall_score
        missing_critical = len(field_insights.get('missing_critical', []))
        matched_count = field_insights.get('matched_count', 0)

        # Penalise for each missing critical skill
        penalty = min(30, missing_critical * 6)
        # Bonus for high skill match
        bonus = min(10, matched_count // 3)
        return max(0, min(100, base - penalty + bonus))

    @staticmethod
    def _calculate_skill_impact(field_insights: dict) -> list:
        """
        Return a list of {skill, score_boost} for missing skills,
        so the frontend can show "+ Add Docker → +6 ATS score".
        """
        impact = []
        missing_critical = field_insights.get('missing_critical', [])
        missing_advanced = field_insights.get('missing_advanced', [])

        for skill in missing_critical[:5]:
            impact.append({'skill': skill, 'boost': 6, 'priority': 'critical'})
        for skill in missing_advanced[:4]:
            impact.append({'skill': skill, 'boost': 3, 'priority': 'recommended'})

        # Generic structural improvements
        if not field_insights.get('has_quantifiable_impact', False):
            impact.append({'skill': 'Quantifiable achievements', 'boost': 5, 'priority': 'recommended'})

        return impact[:8]

    @staticmethod
    def _calculate_experience_score(text: str) -> float:
        """Calculate experience quality score"""
        score = 60  # Base score
        
        # Check for date ranges (indicates work history)
        date_ranges = re.findall(r'\b(19|20)\d{2}\s*[-–—]\s*((19|20)\d{2}|present|current)\b', text.lower())
        score += min(20, len(date_ranges) * 5)
        
        # Check for action verbs (indicates accomplishments)
        action_verbs = [
            'developed', 'created', 'managed', 'led', 'implemented', 'designed',
            'built', 'improved', 'increased', 'reduced', 'achieved', 'delivered',
            'launched', 'optimized', 'collaborated', 'coordinated'
        ]
        action_verb_count = sum(1 for verb in action_verbs if verb in text.lower())
        score += min(15, action_verb_count * 2)
        
        # Check for quantifiable achievements (numbers/percentages)
        has_metrics = bool(re.search(r'\d+%|\$\d+|[\d,]+\s*(users|customers|revenue|growth)', text.lower()))
        if has_metrics:
            score += 5
        
        return min(100, score)
    
    @staticmethod
    def _calculate_keywords_score(text: str, field: str) -> float:
        """Calculate ATS keyword optimization score"""
        score = 60  # Base score
        
        # Check for industry buzzwords
        buzzwords = [
            'innovative', 'strategic', 'results-driven', 'cross-functional',
            'scalable', 'efficient', 'collaborative', 'data-driven', 'agile'
        ]
        buzzword_count = sum(1 for word in buzzwords if word in text)
        score += min(20, buzzword_count * 3)
        
        # Check for proper formatting indicators
        has_bullet_points = '•' in text or '·' in text or re.search(r'^\s*[-*]\s', text, re.MULTILINE)
        if has_bullet_points:
            score += 10
        
        # Check for section headers (usually in caps or bold)
        section_headers = re.findall(r'\b[A-Z][A-Z\s]{3,}\b', text)
        if len(section_headers) >= 3:
            score += 10
        
        return min(100, score)
    
    @staticmethod
    def extract_resume_sections(text: str) -> Dict[str, str]:
        """Extract key sections from resume for question generation"""
        sections = {
            'skills': '',
            'experience': '',
            'projects': '',
            'education': '',
            'certifications': ''
        }
        
        text_lower = text.lower()
        
        # Simple section extraction (can be improved with NLP)
        for section_name in sections.keys():
            # Find section header
            pattern = rf'\b{section_name}\b.*?(?=\n\n|\n[A-Z]{{3,}}|\Z)'
            match = re.search(pattern, text_lower, re.DOTALL)
            if match:
                sections[section_name] = match.group(0)
        
        return sections
