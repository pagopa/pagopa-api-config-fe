import React from 'react';
import {Alert} from "react-bootstrap";

const NotFound = props => {
    return (

            <Alert className={'col-md-12'} variant={'danger'}>
                Pagina non disponibile!
            </Alert>

    );
};

export default NotFound;
