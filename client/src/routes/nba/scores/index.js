import React, { useState, useEffect } from 'react';
import { Button } from 'react-bootstrap';
import '../../../css/bootstrap.min.css';
import BoxScore from './BoxScore.js';
import Comments from '../../../comments.js';
import { NBAteams } from '../../../teams';

let dateObj = new Date();
const currDate = new Date();

const getImage = (name) => {
    return `${process.env.PUBLIC_URL}/assets/images/nba_logos/${name}.svg`;
}

const getGameTime = (time) => {
    return new Date(time).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
}

const getStatus = (game) => {
    try {
        if (!game.status.type.completed && game.status.type.state === 'pre')
            return <h3>{getGameTime(game.date)}</h3>
        else if (!game.status.type.completed)
            return <h3 style={{ color: 'red', fontWeight: 'bold' }}>{'Q' + game.status.period + ' ' + game.status.displayClock}</h3>;
        else
            return <h3>Final</h3>
    } catch (err) {
        // Really stupid
        return <h3>{err}</h3>
    }
}

const idFromEId = (eId) => {
    for (let i = 0; i < NBAteams.length; i += 1) {
        if (NBAteams[i].eId === eId) {
            return NBAteams[i].id;
        }
    }
    return null;
}

const Scores = () => {
    const [data, setData] = useState(null);
    const [queryURL, setQueryURL] = useState(null);
    const [gameData, setGameData] = useState(null);
    const [giTemp, setGITemp] = useState(null);
    const [date, setDate] = useState(null);
    const [errmsg, setErrmsg] = useState(null);
    const [gameInfo, setGameInfo] = useState(null);
    const [boxClicked, setBoxClicked] = useState(false);

    // Initialize date
    if (!date)
        setDate(dateObj.toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }));

    // Set title
    useEffect(() => {
        document.title = 'NBA Scores';
    }, []);

    // Box score button handler
    const boxPress = (game) => {
        const url = `/api/nba/boxscore/${game.id}`;
        setGameInfo(null);
        setGameData(null);
        setGITemp(game);

        if (queryURL !== url) {
            setQueryURL(url);
            setBoxClicked(true);
        }
        else {
            setQueryURL(null);
            setBoxClicked(false);
        }
    }

    // Date buttons handler
    const datePress = (dir) => {
        if (data) {
            dateObj.setDate(dateObj.getDate() + dir);

            // Set new date
            setDate(dateObj.toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }));

            // Set all others to null
            setGameData(null);
            setData(null);
            setQueryURL(null);
            setErrmsg(null);
            setBoxClicked(false);
            setGameInfo(null);
        }
    }

    // Set date to today
    const dateToday = () => {
        if (data) {
            dateObj.setTime(currDate.getTime());
            setDate(dateObj.toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }));
            setGameData(null);
            setData(null);
            setErrmsg(null);
            setBoxClicked(false);
            setGameInfo(null);
        }
    }

    // Fetch from date
    useEffect(() => {
        if (!data) {
            const month = ("0" + (dateObj.getMonth() + 1)).slice(-2);
            const day = ("0" + dateObj.getDate()).slice(-2);
            const year = dateObj.getFullYear();

            fetch(`/api/nba/date/${month}${day}${year}`)
                .then((res) => res.json())
                .then((data) => {
                    setData(data.data);
                    if (data.status !== 'ok')
                        setErrmsg(data.error);
                })
                .catch(err => {
                    console.error("Error fetching data:", err);
                    console.error(data);
                });
        }
    }, [data]);

    // Fetch box score
    useEffect(() => {
        if (queryURL) {
            fetch(queryURL)
                .then((res) => res.json())
                .then((gameData) => {
                    setGameInfo(giTemp);
                    if (gameData.status === 'ok')
                        setGameData(gameData.data);
                    else
                        setErrmsg("Box score unavailable");
                })
                .catch(err => {
                    console.error("Error fetching data: ", err);
                });
        }
    }, [queryURL, giTemp]);

    return (
        <div className='score-content'>
            <span id='controls'>
                <Button variant='success' onClick={() => datePress(-7)} title='Back 1 week'>{"<<"}</Button>{' '}
                <Button variant='success' onClick={() => datePress(-1)} title='Back 1 day'>{"<"}</Button>
                <Button variant='link' style={{ color: 'black' }} onClick={() => dateToday()}>{date}</Button>
                <Button variant='success' onClick={() => datePress(1)} title='Forward 1 day'>{">"}</Button>{' '}
                <Button variant='success' onClick={() => datePress(7)} title='Forward 1 week'>{">>"}</Button>
            </span>
            <br />
            <div className='games'>{!data ? '' : (
                data.games.map(game => {
                    return (
                        <div key={game.id}>
                            <h2>
                                <img src={getImage(idFromEId(game.competitors[0].id))} alt={game.competitors[0].team.displayName} height='50'></img>
                                {game.competitors[0].team.abbreviation} vs {game.competitors[1].team.abbreviation}
                                <img src={getImage(idFromEId(game.competitors[1].id))} alt={game.competitors[1].team.displayName} height='50'></img>
                            </h2>
                            <p>{game.competitors[0].score} : {game.competitors[1].score}</p>
                            {getStatus(game)}
                            <Button variant='dark' onClick={() => boxPress(game)}>Box Score</Button>{' '}
                        </div>
                    );
                })
            )}</div>
            {(!data || (boxClicked && (!gameData && !errmsg))) && <img id='load' src={`${process.env.PUBLIC_URL}/assets/loading/load_ring.svg`} alt='Fetching data...' />}

            <div className='boxscore'>
                {gameData && boxClicked && <span><hr className='separator' /><br /></span>}
                {!gameData ? (errmsg === 'No games scheduled' ? <span><br /><h2>{errmsg}</h2></span> : boxClicked && <span><br /><h2>{errmsg}</h2></span>)
                    : <BoxScore gameData={gameData} />}
            </div>
            {gameData && boxClicked && <hr className='separator' />}
            {boxClicked && gameInfo && <Comments id={gameInfo.id} type='nba' />}
        </div>
    );
}

export default Scores;