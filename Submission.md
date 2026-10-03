# See2Solve

## Team / attendee

- Team name (if applicable): Individual Participant
- Members and GitHub usernames:
  - Aehsan Alam — @ealam1276-dev
- Profile links (optional):
  - https://github.com/ealam1276-dev

## Challenge

Select the challenge you are entering:

- [ ] Best Open-Source AI Project
- [x] Best Use of Gemma 4
- [ ] Build on elah

If listing multiple categories, confirm eligibility with the organizers and complete evidence for each.

## Project links

- Public GitHub repository:
  https://github.com/ealam1276-dev/See2Solve
- Open-source license (link to the license file):
  [Add your LICENSE file link after adding an open-source license]

## Problem and solution

See2Solve is a multimodal AI assistant designed to help users understand confusing visual information such as coding errors, software issues, screenshots, documents, and diagrams.

The main workflow is:

User uploads a screenshot
→ See2Solve sends the image and user's optional question to Gemma 4 through the Gemini API
→ Gemma 4 analyzes the visual information
→ The application generates an actionable response containing the identified problem, root cause, solution, step-by-step instructions, and prevention tips.

The key value is that users do not need to manually describe all the information visible in an image. The multimodal model can directly understand the visual input and turn it into a useful result.

## Approach and technologies

See2Solve uses a React-based frontend with a Node.js/Express backend. The application accepts an image and an optional user question, then sends the visual input and structured prompt to Gemma 4 through the Gemini API.

Technologies used:

- React.js
- Tailwind CSS
- Node.js
- Express.js
- Gemini API
- Gemma 4
- Git and GitHub

Gemma 4 was chosen because the core problem requires multimodal understanding of screenshots and other visual inputs. The model is used to identify information from the image, reason about the user's problem, and generate an actionable response.

Development was accelerated with AI-assisted coding tools. All generated code was reviewed and integrated into the project by the project author.

## Challenge evidence

### Best Use of Gemma 4

- Gemma 4 model identifier and Gemini API integration:

  Gemma 4 is used as the core multimodal AI model through the Gemini API. The application sends the uploaded image together with a structured analysis prompt to the Gemma 4 model and receives the generated solution.

  Exact model identifier:
  [ADD THE CONFIRMED GEMMA 4 MODEL IDENTIFIER HERE]

- Code link showing the integration:

  https://github.com/ealam1276-dev/See2Solve

  Relevant integration file:
  [ADD THE ACTUAL FILE PATH, e.g. server.js, AFTER CONFIRMING IT]

- Input and useful output; multimodal value where applicable:

  Input:
  A user uploads a screenshot containing a visual problem, such as a coding error, software issue, document, diagram, or other confusing visual information.

  Useful output:
  Gemma 4 analyzes the image and generates:
  1. Problem identification
  2. Root cause
  3. Recommended solution
  4. Step-by-step instructions
  5. Prevention tips

  Multimodal value:
  The user does not need to manually type the information contained in the screenshot. Gemma 4 directly processes the visual information and converts it into an actionable response.

## Current status

- What works:

  - Public React-based web application
  - Screenshot/image upload
  - Image preview
  - User question input
  - Gemma 4 multimodal analysis through the Gemini API
  - AI-generated problem explanation
  - Root-cause analysis
  - Step-by-step solution
  - Result display
  - Error/loading handling

- Known limitations / incomplete features:

  - The quality of the generated result depends on the clarity and amount of information available in the uploaded image.
  - Highly ambiguous screenshots may require additional user context.
  - The current prototype focuses on a streamlined screenshot-to-solution workflow.

- What you would improve next:

  - Support additional document and image formats
  - Add specialized analysis modes for different visual inputs
  - Improve structured response validation
  - Add conversation/history support
  - Add richer code-error detection and suggested fixes
  - Improve accessibility and mobile responsiveness

## Submission checklist

- [x] Project repository is public and links work.
- [x] Required challenge evidence is included.
- [ ] Project uses an open-source license where required by the challenge.
- [x] Work and reused materials are represented honestly.
- [x] No API keys, tokens, passwords, or private data are included.
- [x] I followed the organizers' build window and submission instructions.
