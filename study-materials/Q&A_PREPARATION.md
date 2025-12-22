# Q&A Preparation Guide

## Technical Questions

### 1. "Why did you choose MongoDB over SQL?"

**Answer**:
"We chose MongoDB for several reasons. First, medical data can have varying structures - patient records, studies, and reports don't always fit a rigid schema. MongoDB's flexible document model allows us to adapt to different data structures easily. Second, the JSON-like format matches JavaScript objects naturally, making development smoother. Third, MongoDB scales well horizontally, which is important for a multi-user system. Finally, for our use case with user-isolated data, the document model works perfectly - each user's data is naturally separated."

**Key Points**:
- Flexible schema for medical data
- JSON-like structure matches JavaScript
- Easy horizontal scaling
- Good for document-based data

### 2. "How does DICOM parsing work?"

**Answer**:
"DICOM parsing involves several steps. First, we read the file as an ArrayBuffer using the FileReader API. Then we use the dicom-parser library to parse the binary DICOM structure. The library extracts metadata tags - things like patient name, study date, image dimensions. We also extract the pixel data, which is stored at tag x7FE00010. The challenging part is handling different formats: images can be 8-bit or 16-bit, signed or unsigned, and use different byte orders (endianness). We check these properties and convert the pixel data to the appropriate JavaScript typed array. For CT scans, we also apply rescale slope and intercept to convert pixel values to Hounsfield units, which is the standard for CT imaging."

**Key Points**:
- FileReader reads binary data
- dicom-parser extracts metadata and pixel data
- Handle bit depth (8/16-bit)
- Handle endianness
- Apply rescale for Hounsfield units

### 3. "How do you ensure data security?"

**Answer**:
"We implement multiple layers of security. First, authentication uses JWT tokens with 7-day expiration. Passwords are hashed with bcrypt using 10 salt rounds before storage - they're never stored in plain text. Second, all API routes are protected with middleware that verifies the JWT token. Third, and most importantly, we implement user-level data isolation. Every database query filters by the logged-in user's ID - patients filter by `createdBy`, studies filter by `uploadedBy`, and reports filter by `createdBy`. This means users physically cannot access other users' data, even if they tried to manipulate API calls. We also validate all inputs on both frontend and backend to prevent injection attacks."

**Key Points**:
- JWT authentication with expiration
- bcrypt password hashing
- Protected routes with middleware
- User-level data isolation (critical)
- Input validation

### 4. "What is window/level adjustment?"

**Answer**:
"Window/Level is a fundamental technique in medical imaging for adjusting contrast and brightness. The 'Window' is the range of pixel values displayed - a narrow window means high contrast, a wide window means low contrast. The 'Level' is the center point of that window - it controls brightness. Different tissue types require different window/level settings. For example, bone imaging uses a wide window (1500) and high level (300), while soft tissue uses a narrower window (400) and lower level (50). The algorithm maps pixel values within the window range to display values (0-255), with values below the window shown as black and values above shown as white. This allows radiologists to optimize the image for viewing specific anatomical structures."

**Key Points**:
- Window = contrast range
- Level = brightness center
- Different presets for different tissues
- Mathematical transformation
- Essential for medical imaging

### 5. "How does the chatbot work?"

**Answer**:
"The chatbot integrates with OpenAI's GPT-3.5-turbo API. When a user sends a message, the frontend sends both the message and conversation history to our backend. The backend checks if an OpenAI API key is configured. If yes, it calls the OpenAI API with a system prompt that provides medical imaging context - the AI knows it's helping with a DICOM viewer platform. The conversation history is included to maintain context. If the API key isn't configured or the API call fails, we fall back to a simple keyword-matching system that provides basic responses. The response is then sent back to the frontend and displayed in the chat interface."

**Key Points**:
- OpenAI GPT-3.5-turbo integration
- Medical imaging context in system prompt
- Conversation history for context
- Fallback mechanism
- Backend API route

### 6. "What challenges did you face?"

**Answer**:
"Several challenges stand out. First, DICOM file format complexity - handling different bit depths, endianness, and signed/unsigned pixel data required careful implementation. Second, pixel data rendering performance - large images (512x512 or 1024x1024) have hundreds of thousands of pixels, and processing them in real-time for window/level adjustments required optimization. Third, implementing proper data isolation - ensuring every database query filters by user ID was critical for security. Fourth, managing complex state in the DICOM viewer component - with 30+ state variables, proper state management was essential. Finally, understanding medical imaging concepts like window/level and Hounsfield units required research into radiology practices."

**Key Points**:
- DICOM format complexity
- Performance optimization
- Data isolation implementation
- State management
- Medical domain knowledge

### 7. "How would you scale this application?"

**Answer**:
"For scaling, I'd implement several strategies. On the backend, I'd use load balancing across multiple Node.js servers - since we use stateless JWT authentication, this works well. For the database, MongoDB Atlas supports automatic sharding for horizontal scaling. I'd add a caching layer like Redis for frequently accessed data. For the frontend, I'd use a CDN to serve static assets. For DICOM files, I'd implement cloud storage (AWS S3 or Azure Blob) instead of storing in the database. I'd also add image compression and lazy loading. For the API, I'd implement rate limiting to prevent abuse. Finally, I'd consider microservices architecture - separating DICOM processing, user management, and reporting into different services."

**Key Points**:
- Load balancing (stateless JWT enables this)
- Database sharding
- Caching layer (Redis)
- CDN for frontend
- Cloud storage for DICOM files
- Rate limiting
- Microservices (future)

### 8. "Why React over other frameworks?"

**Answer**:
"React was chosen for several reasons. First, it's the most popular frontend framework with a huge ecosystem and community support. Second, the component-based architecture fits our needs perfectly - we have reusable components like the DICOM viewer, patient cards, and forms. Third, React's Context API provides a simple state management solution without needing additional libraries like Redux. Fourth, React's virtual DOM provides good performance for our interactive DICOM viewer. Fifth, there's excellent tooling - Vite for fast development and building, React Router for routing. Finally, React's functional components with hooks make the code clean and maintainable."

**Key Points**:
- Popular with large ecosystem
- Component-based architecture
- Context API for state management
- Good performance
- Excellent tooling
- Clean code with hooks

### 9. "How do you handle errors?"

**Answer**:
"Error handling is implemented at multiple levels. On the frontend, all API calls are wrapped in try-catch blocks, and we use React Error Boundaries to catch component errors. Users see friendly error messages via toast notifications. On the backend, we have a global error handler middleware that catches all errors, logs them for debugging, and returns appropriate HTTP status codes with generic error messages (we don't leak sensitive information). For validation errors, Mongoose schema validation provides automatic error messages. We also handle specific cases like duplicate emails, invalid tokens, and missing fields with clear error messages. Network errors are detected and users are informed if the backend is unreachable."

**Key Points**:
- Frontend: try-catch, Error Boundaries
- Backend: Global error handler
- User-friendly messages
- Proper HTTP status codes
- No information leakage
- Network error detection

### 10. "What testing did you do?"

**Answer**:
"We performed comprehensive manual testing of all features. This included testing user registration and login, DICOM file upload with various file formats, image viewing and manipulation tools, patient CRUD operations, report generation, and the chatbot. We tested edge cases like invalid file formats, network failures, and invalid inputs. We also tested the security aspect - verifying that users can only access their own data. While we didn't implement automated unit or integration tests, manual testing ensured all features work correctly. For production, I would add automated testing using Jest for unit tests, React Testing Library for component tests, and Supertest for API integration tests."

**Key Points**:
- Comprehensive manual testing
- Edge case testing
- Security testing
- Future: Automated testing

## Design Decision Questions

### 11. "Why JWT over session-based authentication?"

**Answer**:
"JWT was chosen because it's stateless and works well with our architecture. Since we have a separate frontend and backend, JWT tokens can be stored on the client side and sent with each request. This means we don't need server-side session storage, which makes the system more scalable - we can add more backend servers without needing shared session storage. JWT tokens also work well with RESTful APIs and SPAs. The 7-day expiration provides a good balance between security and user convenience. However, for production, I would implement refresh tokens for better security."

**Key Points**:
- Stateless (scalable)
- Works with SPAs
- No server-side storage needed
- RESTful API compatible
- Future: Refresh tokens

### 12. "Why Context API over Redux?"

**Answer**:
"For this project, Context API was sufficient and simpler. We have relatively straightforward state management needs - authentication state, patient/study/report data, and notifications. Context API provides a built-in solution without additional dependencies. It's easier to learn and implement, which was important for development speed. However, if the application grows significantly with more complex state interactions, Redux would be a better choice. For now, Context API meets our needs while keeping the codebase simpler."

**Key Points**:
- Simpler for our needs
- No additional dependencies
- Easier to learn
- Sufficient for current complexity
- Can migrate to Redux if needed

## Architecture Questions

### 13. "Explain the data flow"

**Answer**:
"The data flow follows a clear pattern. When a user performs an action, like creating a patient, the React component updates its state and calls a function from DataContext. The context function calls the API service layer, which makes an HTTP POST request to the backend with the JWT token in the Authorization header. The Express middleware stack processes the request - CORS, body parsing, and authentication middleware verify the token and attach the user to the request. The route handler receives the request, validates the input, creates a Mongoose query that filters by the user's ID, and saves to MongoDB. The response is sent back as JSON, the frontend updates its state, and the UI re-renders to show the new patient."

**Key Points**:
- User action → Component state
- Context API → API service
- HTTP request with JWT
- Middleware processing
- Database query with user filter
- Response → State update → UI re-render

### 14. "How does data isolation work?"

**Answer**:
"Data isolation is implemented at the database query level. Every route handler that accesses data includes a filter by the logged-in user's ID. For patients, we filter by `createdBy: req.user._id`. For studies, we filter by `uploadedBy: req.user._id`. For reports, we filter by `createdBy: req.user._id`. The `req.user` is set by the authentication middleware after verifying the JWT token. This means even if a user tried to manipulate API calls to access another user's data, the database query would still filter by their own ID, preventing unauthorized access. We also have indexes on these fields for fast queries."

**Key Points**:
- Database-level filtering
- Every query includes user ID filter
- Set by authentication middleware
- Prevents unauthorized access
- Indexed for performance

## Future Improvement Questions

### 15. "What would you improve?"

**Answer**:
"Several improvements come to mind. First, I'd add comprehensive automated testing - unit tests, integration tests, and E2E tests. Second, I'd implement full 3D volume rendering using VTK.js for better visualization. Third, I'd add measurement tools - distance, area, and angle measurements on images. Fourth, I'd implement cloud storage for DICOM files instead of processing them entirely in the browser. Fifth, I'd add real-time collaboration features so multiple users can view the same study. Sixth, I'd implement email notifications for report completion. Seventh, I'd add audit logging for compliance. Finally, I'd improve accessibility with WCAG compliance and better keyboard navigation."

**Key Points**:
- Automated testing
- Enhanced 3D rendering
- Measurement tools
- Cloud storage
- Collaboration features
- Notifications
- Audit logging
- Accessibility

## Project-Specific Questions

### 16. "What is the most complex part?"

**Answer**:
"The DICOM viewer component is the most complex part. It has over 30 state variables managing everything from file uploads to image rendering to annotations. The DICOM parsing itself is complex - handling different bit depths, endianness, and applying window/level transformations in real-time. The canvas rendering with annotations requires careful coordinate management. Managing all this state while keeping the component performant and the code maintainable was challenging. I used React hooks extensively - useState for state, useEffect for side effects, useRef for DOM references, and useMemo/useCallback for performance optimization."

**Key Points**:
- DICOM viewer component (1871 lines)
- 30+ state variables
- Complex DICOM parsing
- Real-time rendering
- Performance optimization

### 17. "How did you learn about DICOM?"

**Answer**:
"I researched the DICOM standard extensively. I read the official DICOM documentation, studied DICOM tag structures, and learned about medical imaging concepts like window/level and Hounsfield units. I also studied how existing DICOM viewers work. The dicom-parser library documentation was very helpful. I tested with various DICOM files to understand different formats. Understanding the medical imaging domain was important - I learned about how radiologists use these tools, which informed the UI design and feature set."

**Key Points**:
- Research DICOM standard
- Study documentation
- Learn medical imaging concepts
- Test with real files
- Understand user needs

## Tips for Answering Questions

1. **Be Honest**: If you don't know something, admit it
2. **Be Specific**: Give concrete examples
3. **Be Confident**: You built this, you know it
4. **Be Concise**: Don't ramble
5. **Be Technical**: Show your understanding
6. **Be Practical**: Connect to real-world use

## Questions to Ask the Panel

1. "What aspects would you like me to elaborate on?"
2. "Are there specific features you'd like to see?"
3. "Would you like me to show any particular code section?"
4. "Do you have questions about the architecture?"
5. "Is there anything you'd like me to explain in more detail?"

Good luck with your Q&A session!

