import React, {useEffect, useState} from "react";
import SidebarItems from "./SidebarItems";
import {BrowserRouter, Link} from "react-router-dom";


function Sidebar(props, {defaultActive,}) {

    const [activeIndex, ] = useState(defaultActive || 1);

    console.log("props", props, defaultActive);
    // const location = props.history.location;
    // const lastActiveIndexString = localStorage.getItem("lastActiveIndex");
    // const lastActiveIndex = Number(lastActiveIndexString);
    // const [activeIndex, setActiveIndex] = useState(lastActiveIndex || defaultActive);
    //
    // function changeActiveIndex(newIndex) {
    //     localStorage.setItem("lastActiveIndex", newIndex);
    //     setActiveIndex(newIndex);
    // }
    //
    // function getPath(path) {
    //     if (path.charAt(0) !== "/") {
    //         return  "/" + path;
    //     }
    //     return path;
    // }
    //
    // useEffect(()=> {
    //     console.log("todo set active");
        // const activeItem = SidebarItems.findIndex(item=> getPath(item.route) === getPath(location.pathname))
        // changeActiveIndex(activeItem);
    // }, [location]);


    return (
            // <BrowserRouter>
        <ul>
            {
                SidebarItems.map(item => (
                        <li key={item.name}>
                            <Link to={item.route}>
                                {item.name}
                            </Link>
                        </li>
                ))
            }
        </ul>
            // </BrowserRouter>
    );

}

export default Sidebar;
