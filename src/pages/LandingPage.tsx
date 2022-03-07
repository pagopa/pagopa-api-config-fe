import React from 'react';
import ReactMarkdown from "react-markdown";
import raw from "raw.macro";


// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IState {}

export default class LandingPage extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);
    }

    render(): React.ReactNode {
        const content = raw("../assets/resources/landing-page.md");
        return (
                <div className="container-fluid mt-3">
                    <ReactMarkdown>{content}</ReactMarkdown>
                </div>
        );
    }
};
