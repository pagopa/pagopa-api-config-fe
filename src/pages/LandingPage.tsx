import React from 'react';
import ReactMarkdown from "react-markdown";
import raw from "raw.macro";

const LandingPage = () => {
    const content = raw("../assets/resources/landing-page.md");
    return (
        <div className="container-fluid mt-3">
            <ReactMarkdown>{content}</ReactMarkdown>
        </div>
    );
};

export default LandingPage;
