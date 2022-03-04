import React from 'react';
import ReactMarkdown from "react-markdown";
import content from "../assets/resources/landing-page.md";

const LandingPage = () => (
        <div className="container-fluid mt-3">
            <ReactMarkdown>{content}</ReactMarkdown>
        </div>
    );

export default LandingPage;
