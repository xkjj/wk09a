const express = require('express');
let app = express();
const mysql = require('mysql2');

app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',       // '' XAMPP or 'root' MAMP
    database: 'kjarosz02',       // your DN name
    port: '3306',       // XAMPP 3306 or 8889 MAMP
});

connection.connect((err) => {
    if (err) return console.log(err.message);
    console.log("connected to local mysql db");
});


app.get('/', (req, res) => {

    let read = `SELECT gig_events.id, gig_events.venue, gig_events.performs_on, gig_artists.name 
                FROM gig_events 
                INNER JOIN 
                gig_artists ON 
                gig_events.band_id = gig_artists.id 
                ORDER BY performs_on ASC;`;

    connection.query(read, (err, rows) => {
        if (err) throw err;
        res.render('listings', { gigdata: rows });
    });

});

app.get('/gig', (req, res) => {

    const evid = req.query.eventid;

    const sqlevent = `SELECT gig_events.id, gig_events.venue, gig_events.performs_on, gig_artists.name, gig_events.event_details, gig_artists.details, gig_events.band_id 
                        FROM gig_events 
                        INNER JOIN 
                        gig_artists ON 
                        gig_events.band_id = gig_artists.id 
                        WHERE gig_events.id = ${evid}`;

    connection.query(sqlevent, (err, rows) => {

        if (err) throw err;

        let getband = rows[0].band_id;
        const getgenres = `SELECT gig_artist_genre.id, gig_genres.genre_name FROM gig_artist_genre 
                        INNER JOIN gig_genres 
                        ON 
                        gig_artist_genre.genre_id = gig_genres.id 
                        WHERE artist_id = ${getband};`;

        connection.query(getgenres, (err, genres) => {

            if (err) throw err;
            console.log(genres);
            res.render('giglistings', { gigdata: rows, genredata: genres });

        });


    });

});

app.get('/insertevent', (req, res) => {

    let sqlbands = 'select * from gig_artists ORDER BY name ASC';
    connection.query(sqlbands, (err, rows) => {

        res.render('create_event', { bands: rows });
    });


});

app.get('/insertartist', (req, res) => {

    let getgenres = `SELECT * FROM gig_genres`
    connection.query(getgenres, (err, rows) => {
        res.render('create_performer', { genres: rows });
    });
});

app.post('/insertartist', (req, res) => {

    let artist = req.body.artist_field;
    let descript = req.body.details_field;
    let genreID = req.body.genre_field;
    let artistID = res.insertId;

    let insertbandsql = `INSERT INTO gig_artists (name, details) 
                             VALUES ('${artist}', '${descript}');`;


    connection.query(insertbandsql, (err, result) => {
        if (err) throw err;
        console.log(result.insertId);


        let artistgenresql = `INSERT INTO gig_artist_genre (artist_id, genre_id)
                                   VALUES ('${artistID}', '${genreID}');`;

        connection.query(artistgenresql, (err2, result2) => {
            if(err2) throw err2;
            result2.send('artist added with a genre');


        });

    });


});


app.listen(process.env.PORT || 3000, () => {
    console.log("Server started on: http://localhost:3000");
});