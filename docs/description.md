**AI Content Moderation Platform**

*Intern Assignment -- Full Stack*

# 1. Introduction

Design and implement a full-stack AI-powered Content Moderation Platform
that allows users to submit images for automated policy compliance
screening. The system supports a structured appeal process for disputed
verdicts, gives administrators meaningful oversight tools, and allows
fine-grained control over how moderation policies are enforced across
different violation categories.

# 2. Objectives

-   Demonstrate the ability to build a complete, multi-role web
    application from scratch.

-   Integrate an AI model meaningfully into a core workflow

-   Show proficiency in data modeling across interconnected entities:
    users, submissions, verdicts, appeals, and policies.

-   Apply best practices in project structure, API design, and code
    organization.

-   Deliver a functional frontend that accurately reflects real system
    state at all times.

# 3. Moderation Categories

Every submitted image is screened against all active moderation
categories. For each category, the system produces a classification
result, a confidence score, and a short reasoning summary.

  -----------------------------------------------------------------------
  **Category**          **Description**
  --------------------- -------------------------------------------------
  Graphic Violence      Depictions of physical harm, gore, or serious
                        injury to humans or animals.

  Hate Symbols          Imagery associated with extremist ideologies or
                        designated terrorist organizations.

  Self-Harm             Visual content depicting or glorifying acts of
                        self-inflicted injury.

  Extremist Propaganda  Content that promotes, recruits for, or glorifies
                        violent extremist movements.

  Weapons & Contraband  Imagery depicting illegal weapons, drug
                        manufacturing, or trafficking-related content.

  Harassment &          Imagery intended to degrade, threaten, or
  Humiliation           publicly humiliate an identifiable individual.
  -----------------------------------------------------------------------

# 4. Core Features

## 4.1 User Submissions

Users can submit one or more images in a single request. Each image is
screened independently and receives its own verdict. A submission is
considered clean if no active category produces a result that meets or
exceeds the configured confidence threshold. Users can view their full
submission history and filter results by outcome, category, and date.

## 4.2 Verdict System

Each image produces a structured verdict containing the following:

-   The overall outcome: Approved, Flagged for Review, or Blocked.

-   A per-category breakdown listing the classification result,
    confidence score, and a brief reasoning string.

-   A timestamp and a reference to the policy configuration active at
    the time of the submission.

The overall outcome is determined by the enforcement behavior configured
per category by an administrator. If a category is set to Auto-Block,
any result meeting the confidence threshold immediately marks the
submission as Blocked. If set to Flag for Review, the submission is
marked as Flagged and enters the admin review queue.

## 4.3 Appeal Workflow

Users may file an appeal against any submission that received a Flagged
or Blocked outcome. An appeal requires a written justification from the
user explaining why they believe the verdict is incorrect. Each appeal
is linked to a specific submission and enters a pending queue visible
only to administrators.

Administrators review each appeal and either accept or reject it, with
the option to attach a written response. Upon acceptance, the submission
verdict is overridden to Approved. Users can track the current status of
any appeal (Pending, Accepted, or Rejected) from their submission
history.

## 4.4 Policy Configuration

Administrators control the behavior of each moderation category
independently. For every category, an admin may:

-   Enable or disable the category entirely. Disabled categories are
    skipped during screening.

-   Set a confidence threshold, expressed as a percentage, below which a
    detection is treated as inconclusive and does not affect the
    verdict.

-   Set the enforcement behavior to either Auto-Block or Flag for
    Review.

All policy changes apply to submissions made after the change and do not
retroactively alter existing verdicts.

## 4.5 Admin Analytics Dashboard

Administrators have access to a platform-wide analytics view that
provides a clear picture of system activity. This includes:

-   Total submission volume over time.

-   Verdict distribution broken down by outcome and by category.

-   Appeal volume, resolution rate, and outcome breakdown (accepted vs.
    rejected).

-   A ranked list of users by submission count and by violation count.

# 5. User Roles

The system has two distinct roles with non-overlapping administrative
capabilities.

  -----------------------------------------------------------------------
  **Role**        **Capabilities**
  --------------- -------------------------------------------------------
  User            Register, log in, submit images, view personal
                  submission history, file appeals, and track appeal
                  status.

  Admin           All user capabilities, plus access to the appeals
                  queue, manual verdict overrides, policy configuration,
                  and the analytics dashboard.
  -----------------------------------------------------------------------

# 6. Deliverables

-   A fully functional web application with a connected frontend and
    backend.

-   A REST API that serves as the sole interface between the frontend
    and the database.

-   A MongoDB database with a well-structured, documented schema.

-   A Dockerized setup that runs completely with a single docker-compose
    up command.

-   A README covering setup instructions, required environment
    variables, and a brief explanation of key architecture decisions.