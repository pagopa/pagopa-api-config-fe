import React from "react";

export default class Sidebar extends React.Component {

    render(): React.ReactNode {
        return (

                <ul className="nav flex-column">
                    <li className="nav-item">
                        <a className="nav-link active" href="#">
                            Item-1 <span className="sr-only">(current)</span>
                        </a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" href="#">
                            Item-2
                        </a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" href="#">
                            Item-3
                        </a>
                    </li>
                </ul>
        );
    }
}
