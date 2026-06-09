# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

This is a template repository for a **Distributed Applications Course Project** at PUC Minas (Pontifícia Universidade Católica de Minas Gerais). It serves as a structured framework for students to document and develop distributed systems projects throughout the semester.

The repository is organized around a 5-stage development workflow, with each stage (ETAPA) focusing on a specific aspect of distributed application development.

## Repository Structure

### Core Documentation Stages

The project follows a sequential development approach with documentation-first methodology:

1. **ETAPA 1: Context Documentation** ([docs/contexto.md](docs/contexto.md))
   - Problem definition and project objectives
   - Requirements (functional and non-functional)
   - Target audience and personas
   - System architecture overview
   - Service catalog definition

2. **ETAPA 2: Backend APIs** ([docs/backend-apis.md](docs/backend-apis.md))
   - API objectives and modeling
   - Technology stack selection for backend
   - API endpoints specification (methods, parameters, responses)
   - Security considerations (authentication, authorization)
   - Testing strategy and deployment instructions

3. **ETAPA 3: Web Frontend** ([docs/frontend-web.md](docs/frontend-web.md))
   - Interface design and wireframes
   - Visual design specifications (colors, typography)
   - Data flow diagrams
   - Web-specific technologies and frameworks
   - Testing and deployment procedures

4. **ETAPA 4: Mobile Frontend** ([docs/frontend-mobile.md](docs/frontend-mobile.md))
   - Mobile interface design and wireframes
   - Mobile-specific visual design
   - Data flow in mobile context
   - Mobile development technologies
   - Mobile app testing and deployment

5. **ETAPA 5: Presentation** ([presentation/README.md](presentation/README.md))
   - Final project presentation materials
   - Development process summary video

### Directory Organization

- **[docs/](docs/)**: All project documentation organized by development stage
  - Contains markdown files for each ETAPA with detailed templates
  - [docs/img/](docs/img/): Documentation images and diagrams
- **[src/](src/)**: Source code directory (to be populated by students)
- **[help/](help/)**: Supporting materials and guides
  - Contains instructions for CITATION.cff file
- **[presentation/](presentation/)**: Final presentation materials

### Citation and Academic Attribution

- **CITATION.cff**: Academic citation metadata following CFF (Citation File Format) standard
  - Must be filled with team member names and project details
  - Used for proper academic attribution and project archival

### Contribution Tracking System

- **[docs/CONTRIBUTION_REPORT.md](docs/CONTRIBUTION_REPORT.md)**: Automated contribution tracking report
  - Generated automatically via GitHub Actions every Monday and on pushes to `src/` or `docs/`
  - Tracks individual student contributions (commits, lines of code, files modified, documentation)
  - Provides weekly contribution graphs and distribution charts
  - Can be manually triggered via GitHub Actions workflow

- **[.github/workflows/contribution-tracker.yml](.github/workflows/contribution-tracker.yml)**: GitHub Action workflow
  - Runs weekly and on repository changes
  - Executes Python script to analyze git history
  - Automatically commits updated reports with `[skip ci]`

- **[.github/scripts/generate_contribution_report.py](.github/scripts/generate_contribution_report.py)**: Analysis script
  - Parses git history for contribution metrics
  - Generates markdown tables and PNG visualizations
  - Can be run locally for preview before committing
  - See [.github/scripts/README.md](.github/scripts/README.md) for usage details

**Purpose**: Helps professors evaluate individual student participation in group projects by providing objective metrics on code and documentation contributions.

## Development Workflow

### Documentation-First Approach

Students should complete documentation templates in sequential order (ETAPA 1 → 5) before or alongside implementation. Each documentation file includes:
- Guided sections with descriptive prompts
- Task planning tables (weekly task tracking with status indicators)
- Reference links to relevant resources and best practices

### Task Planning Tables

Each documentation stage includes standardized task tracking tables with:
- **Responsável**: Team member assigned to the task
- **Tarefa/Requisito**: Task or requirement description
- **Iniciado em**: Start date
- **Prazo**: Deadline
- **Status**: Progress indicator (✔️ complete, 📝 in progress, ⌛ delayed, ❌ not started)
- **Terminado em**: Completion date

### Architecture Expectations

Based on [docs/contexto.md](docs/contexto.md), projects should define:
- Component-based architecture diagram showing system structure
- Technology stack for each layer (backend, web frontend, mobile frontend)
- Hosting and deployment infrastructure
- Security mechanisms across all components

## Working with This Template

### When Starting a New Project

1. Fill in the main [README.md](README.md) with project title, team members, and project description
2. Complete [CITATION.cff](CITATION.cff) with team and project metadata
3. Work through each ETAPA sequentially, filling in the documentation templates
4. Add source code to [src/](src/) as development progresses
5. Update the main README.md with installation and usage instructions once implementation begins

### When Modifying Documentation

- Follow the existing template structure in each documentation file
- Keep task planning tables updated with current progress
- Replace placeholder text (marked with brackets like `[Inclua...]` or `[Descreva...]`)
- Add diagrams and wireframes to [docs/img/](docs/img/)
- Update references section with actual sources used

### When Adding Source Code

- Place implementation code in [src/](src/) directory
- Organize code by application type (backend, web-frontend, mobile-frontend)
- Update [src/README.md](src/README.md) with build, test, and run instructions
- Keep documentation in sync with actual implementation

### Working with Contribution Tracking

**For Students:**
- Contribution reports are generated automatically - no manual action needed
- Make regular, meaningful commits to show consistent participation
- Contribute to both code (`src/`) and documentation (`docs/`) for balanced metrics
- Use descriptive commit messages to document your work

**For Professors:**
- View [docs/CONTRIBUTION_REPORT.md](docs/CONTRIBUTION_REPORT.md) to see student contributions
- Manually trigger report generation via GitHub Actions if needed
- Customize tracking parameters in [.github/scripts/generate_contribution_report.py](.github/scripts/generate_contribution_report.py)
- Adjust execution frequency in [.github/workflows/contribution-tracker.yml](.github/workflows/contribution-tracker.yml)

**Tracked Metrics:**
- Total commits per student
- Lines added/removed (code volume)
- Unique files modified (work breadth)
- Documentation-specific contributions
- Weekly activity patterns
- Visual distribution charts

## Key Principles

- **Template Nature**: This repository is a starting point, not a complete application
- **Academic Project**: Designed for semester-long course projects with specific deliverable stages
- **Distributed Systems Focus**: Projects should demonstrate distributed application architecture
- **Multi-Platform**: Expected to include backend APIs, web interface, and mobile interface
- **Documentation Quality**: Documentation templates emphasize security, testing, and deployment considerations

## Notes for Codex

- When asked about build/test/lint commands, check [src/README.md](src/README.md) - students will add these as they implement
- Documentation files are in Portuguese (Brazilian)
- This is a template; many sections contain placeholder text to be replaced by students
- Architecture decisions should align with distributed systems principles taught in the course
- All file modifications should maintain the academic documentation structure
- The contribution tracking system runs automatically - do not modify [docs/CONTRIBUTION_REPORT.md](docs/CONTRIBUTION_REPORT.md) manually
- If asked to customize contribution tracking, modify [.github/scripts/generate_contribution_report.py](.github/scripts/generate_contribution_report.py) or [.github/workflows/contribution-tracker.yml](.github/workflows/contribution-tracker.yml)
- Contribution reports include auto-generated images in [docs/img/contribution-*.png](docs/img/) - these are updated by GitHub Actions
