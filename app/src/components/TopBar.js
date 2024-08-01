import React from 'react';

const TopBar = () => {
    return (
        <div style={styles.topBar}>
            <img src={require('../img/pfc_logo_hz_white.png')} alt="Potlucks For Change" style={styles.logo}/>
        </div>
    );
};

const styles = {
    topBar: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '1rem',
        backgroundColor: 'rgb(99, 160, 76)',
        color: '#fff',
    },
    logo: {
        maxWidth: '225px',
    }
};

export default TopBar;