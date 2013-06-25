function draw(){
    if(settings[9]){/* clear? */
        buffer.clearRect(
            0,
            0,
            width,
            height
        );
    }

    /* move red player paddle, prevent from moving past goal boundaries */
    players[1][0] += p1_move;
    if(players[1][0] > 20){
        players[1][0] = 20;
    }else if(players[1][0] < -90){
        players[1][0] = -90;
    }

    /* if player controlled, handle keypress movement */
    if(ai_or_player){
        if(key_left && !key_right && players[0][0] > -90){
            players[0][0] -= 2;
        }else if(players[0][0] < -90){
            players[0][0] = -90;
        }
        if(key_right && !key_left && players[0][0] < 20){
            players[0][0] += 2;
        }else if(players[0][0] > 20){
            players[0][0] = 20;
        }

    /* else move via AI */
    }else{
        players[0][0] += p0_move;
        if(players[0][0] > 20){
            players[0][0] = 20;
        }else if(players[0][0] < -90){
            players[0][0] = -90;
        }
    }

    buffer.fillStyle = '#3c3c3c';
    i = obstacles.length - 1;
    if(i >= 0){
        do{
            buffer.fillRect(
                obstacles[i][0] + x,
                obstacles[i][1] + y,
                obstacles[i][2],
                obstacles[i][3]
            );
        }while(i--);
    }
    i = scenery.length - 1;
    if(i >= 0){
        do{
            buffer.fillRect(
                scenery[i][0] + x,
                scenery[i][1] + y,
                scenery[i][2],
                scenery[i][3]
            );
        }while(i--);
    }

    i = spawners.length - 1;
    if(i >= 0){
        buffer.fillStyle = '#476291';
        do{
            buffer.fillRect(
                spawners[i][0] + x - 4,
                spawners[i][1] + y - 4,
                8,
                8
            );
        }while(i--);

        /* if current number of particles is less than max, add new particle */
        if(particles.length < settings[4]){
            /* pick a random spawner */
            i = random_number(spawners.length);

            /* add particle */
            particles.push([
                spawners[i][0],/* particle x */
                spawners[i][1],/* particle y */
                Math.random() * (settings[7] * 2) - settings[7],/* particle x speed */
                Math.random() * (settings[7] * 2) - settings[7],/* particle y speed */
                -1/* not linked to a player */
            ]);
        }
    }

    i = particles.length - 1;
    if(i >= 0){
        /* reset movements for recalculation */
        p0_move = -1;
        p1_move = -1;

        do{
            /* if particle is with 90 pixels of center of goal */
            if(particles[i][0] < 90 && particles[i][0] > -90){
                /* if particle is moving downwards */
                if(particles[i][3] > 0){
                    /* link player 0 AI to track this particle if it is closest */
                    if((p0_move === -1 || particles[i][1] > particles[p0_move][1]) && particles[i][1] < players[0][1]){
                        p0_move = i;
                    }

                /* else link player 1 AI to track this particle if it is closest */
                }else if((p1_move === -1 || particles[i][1] < particles[p1_move][1]) && particles[i][1] > players[1][1]){
                    p1_move = i;
                }
            }

            /* if particle has collided with a goal */
            if(particles[i][1]+2 > players[0][8] || particles[i][1]-2 < players[1][8] + players[1][10]){
                /* determine which player scored a goal */
                var temp_player = 0;
                if(particles[i][1] + 2 > players[0][8]){
                    temp_player = 1;
                }

                /* decrease the other players score by 1 if it is greater than 0 */
                if(players[1 - temp_player][11] > 0){
                    players[1 - temp_player][11] -= 1;
                }

                /* increase the scoring players score by 1 */
                if(particles[i][4] === temp_player){
                    players[temp_player][11] += 1;
                }

                /* delete the particle */
                particles.splice(i, 1);

                p0_move = 0;
                p1_move = 0;

            }else{
                /* loop through obstacles to find collisions */
                j = obstacles.length - 1;
                if(j >= 0){
                    do{
                        /* x collisions */
                        if(particles[i][0] >= obstacles[j][0]
                        && particles[i][0] <= obstacles[j][0] + obstacles[j][2]){
                            if(particles[i][3] > 0){
                                if(particles[i][1] > obstacles[j][1] - 2 && particles[i][1] < obstacles[j][1]){
                                    particles[i][3] *= -1;
                                }
                            }else if(particles[i][1] > obstacles[j][1] + obstacles[j][3]
                                  && particles[i][1] < obstacles[j][1] + obstacles[j][3] + 2){
                                particles[i][3] *= -1;
                            }

                        /* y collisions */
                        }else if(particles[i][1] >= obstacles[j][1]
                              && particles[i][1] <= obstacles[j][1] + obstacles[j][3]){
                            if(particles[i][2] > 0){
                                if(particles[i][0] > obstacles[j][0] - 2 && particles[i][0] < obstacles[j][0]){
                                    particles[i][2] *= -1;
                                }

                            }else if(particles[i][0] > obstacles[j][0] + obstacles[j][2]
                                  && particles[i][0] < obstacles[j][0] + obstacles[j][2] + 2){
                                particles[i][2] *= -1;
                            }
                        }
                    }while(j--);
                }

                /* check for collisions with player paddles or edges of game area */
                if(particles[i][1] > players[1][1] + players[1][3] && particles[i][1] < players[0][1]){
                    if(particles[i][0] > -88 && particles[i][0] < 88){
                        if(particles[i][1] > 0){
                            if(particles[i][0] > players[0][0] - 2
                             && particles[i][0] < players[0][0] + players[0][2] + 2){
                                if(particles[i][3] > 0 && particles[i][1] + 2 >= players[0][1]){
                                    particles[i][2] = Math.random() * (settings[7] * 2) - settings[7];
                                    particles[i][3] *= -1;
                                    particles[i][4] = 0;
                                }
                            }

                        }else if(particles[i][0] > players[1][0]- 2
                              && particles[i][0] < players[1][0] + players[1][2] + 2
                              && particles[i][3] < 0
                              && particles[i][1] - 2 <= players[1][1] + players[1][3]){
                            particles[i][3] *= -1;
                            particles[i][4] = 1;
                        }

                    }else{
                        /* left/right wall collisions */
                        if((particles[i][2] < 0 && particles[i][0] - 2 <= -particle_x_limit)
                         || (particles[i][2] > 0 && particles[i][0] + 2 >= particle_x_limit)){
                            particles[i][2] *= -1;
                        }

                        /* player paddle collisions */
                        if((particles[i][3] < 0 && particles[i][1] - 2 <= players[1][1] + players[1][3])
                         || (particles[i][3] > 0 && particles[i][1] + 2 >= players[0][1])){
                            particles[i][3] *= -1;
                        }
                    }
                }
                /* move particles */
                particles[i][0] += particles[i][2];
                particles[i][1] += particles[i][3];
            }
            /* draw particles, #ddd if they are unclaimed and #player_color if they are claimed */
            buffer.fillStyle = particles[i][4] < 0 ? '#ddd' : ['#2d8930', '#c83232'][particles[i][4]];
            buffer.fillRect(
                particles[i][0] + x - 2,
                particles[i][1] + y - 2,
                4,
                4
            );
        }while(i--);

        /* calculate movement direction for next frame if player0 ai is tracking a particle */
        i = players[0][0] + players[0][2] / 2;
        if(p0_move === -1){
            if(i === 0){
                p0_move = 0;

            }else{
                p0_move = i < 0 ? 2 : -2;
            }

        }else{
            p0_move = particles[p0_move][0] > i ? 2 : -2;
        }

        /* calculate movement direction for next frame if player1 ai is tracking a particle */
        i = players[1][0] + players[1][2] / 2;
        if(p1_move === -1){
            if(i === 0){
                p1_move = 0;

            }else{
                p1_move = i < 0 ? 2 : -2;
            }
 
        }else{
            p1_move = particles[p1_move][0] > i ? 2 : -2;
        }
    }

    /* setup text display */
    buffer.textAlign = 'center';
    buffer.textBaseline = 'middle';
    buffer.font = '23pt sans-serif';

    i = players.length - 1;
    if(i >= 0){
        do{
            /* set color to player color */
            buffer.fillStyle = 'rgb(' + players[i][4] + ', '
                                      + players[i][5] + ', '
                                      + players[i][6] + ')';

            /* draw paddle */
            buffer.fillRect(
                players[i][0] + x,
                players[i][1] + y,
                players[i][2],
                players[i][3]
            );

            /* draw goal */
            buffer.fillRect(
                players[i][7] + x,
                players[i][8] + y,
                players[i][9],
                players[i][10]
            );

            /* draw score */
            buffer.fillText(
                'Score: ' + players[i][11] + '/20',
                players[i][0] + x + players[i][2] / 2,
                players[i][1] + y + (i === 0 ? 50 : -50)
            );
        }while(i--);
    }

    /* if either player has 20 or more points and 2 more points than the other player */
    if(players[0][11] >= 20 && players[0][11] > players[1][11] + 1){
        clearInterval(interval);

        buffer.fillStyle = '#262';
        buffer.fillText(
            ai_or_player ? 'You win! ☺' : 'Green player wins!',
            x,
            y / 2
        );
        buffer.fillText(
            settings[11] + ' = Restart',
            x,
            y / 2 + 50
        );
        buffer.fillText(
            'ESC = Main Menu',
            x,
            y / 2 + 90
        );

    }else if(players[1][11] >= 20 && players[1][11] > players[0][11] + 1){
        clearInterval(interval);

        buffer.fillStyle = '#c83232';
        buffer.fillText(
            ai_or_player ? 'You lose. ☹' : 'Red player wins!',
            x,
            y / 2
        );
        buffer.fillText(
            settings[11] + ' = Restart',
            x,
            y / 2 + 50
        );
        buffer.fillText(
            'ESC = Main Menu',
            x,
            y / 2 + 90
        );
    }
    
    if(settings[9]){/* clear? */
        canvas.clearRect(
            0,
            0,
            width,
            height
        );
    }
    canvas.drawImage(
        get('buffer'),
        0,
        0
    );
}

function get(i){
    return document.getElementById(i);
}

function play_audio(i){
    if(settings[0] > 0){
        get(i).currentTime = 0;
        get(i).play();
    }
}

function resize(){
    if(mode > 0){
        width = get('buffer').width = get('canvas').width = window.innerWidth;
        height = get('buffer').height = get('canvas').height = window.innerHeight;

        x = width / 2;
        y = height / 2;
    }
}

function random_number(i){
    return Math.floor(Math.random() * i);
}

function save(){
    i = 8;
    do{
        j = [
            'audio-volume',
            'number-of-obstacles',
            'number-of-spawners',
            'ms-per-frame',
            'number-of-particles',
            'gamearea-height',
            'gamearea-width',
            'particle-speed',
            'obstacle-size'
        ][i];

        if(isNaN(get(j).value) || get(j).value === [1, 10, 3, 25, 100, 200, 420, 1.5, 65][i]){
            ls.removeItem('particleball-' + i);
            settings[i] = [
                1,
                10,
                3,
                25,
                100,
                200,
                420,
                1.5,
                65
            ][i];
            get(j).value = settings[i];

        }else{
            settings[i] = parseFloat(get(j).value);
            ls.setItem(
                'particleball-' + i,
                settings[i]
            );
        }
    }while(i--);

    /* save clear setting, if it is not checked */
    settings[9] = get('clear').checked;
    if(settings[9]){
        ls.removeItem('particleball-9');

    }else{
        ls.setItem(
            'particleball-9',
            0
        );
    }

    /* save move-keys and restart-key, if they differ from default */
    i = 1;
    do{
        if(get(['move-keys', 'restart-key'][i]).value === ['AD', 'H'][i]){
            ls.removeItem('particleball-' + (i + 10));
            settings[i + 10] = [
                'AD',
                'H'
            ][i];

        }else{
            settings[i + 10] = get(['move-keys', 'restart-key'][i]).value;
            ls.setItem(
                'particleball-' + (i + 10),
                settings[i + 10]
            );
        }
    }while(i--);
}

function setmode(newmode, newgame){
    clearInterval(interval);
    obstacles = [];
    particles = [];
    spawners = [];
    mode = newmode;

    /* new game mode */
    if(mode > 0){
        /* if mode is 1, ai vs ai, if mode is 2, player vs ai */
        ai_or_player = mode - 1;

        /* if it's a newgame from the main menu, save settings */
        if(newgame){
            save()
        }

        /* reset keypresses */
        key_left = 0;
        key_right = 0;

        /* get half of width and height of game area */
        var temp_half_width = settings[6] + 100;
        var temp_half_height = settings[5] - 150;

        /* particle_x_limit is how far particles can go on x axis positive or negative */
        particle_x_limit = temp_half_width;

        /* setup player information */
        players = [
            /* player0 (green, human or AI) */
            [
                -35,/* paddle top left x */
                200 + temp_half_height,/* paddle top left y */
                70,/* paddle width */
                5,/* paddle height */
                34,/* player red rgb value */
                102,/* player green rgb value */
                34,/* player blue rgb value */
                -100,/* goal top left x */
                210 + temp_half_height,/* goal top left y */
                200,/* goal width */
                20,/* goal height */
                0/* score */
            ],

            /* player1 (red, AI) */
            [
                -35,/* paddle top left x */
                -205 - temp_half_height,/* paddle top left y */
                70,/* paddle width */
                5,/* paddle height */
                200,/* player red rgb value */
                50,/* player green rgb value */
                50,/* player blue rgb value */
                -100,/* goal top left x */
                -230 - temp_half_height,/* goal top left y */
                200,/* goal width */
                20,/* goal height */
                0/* score */
            ]
        ];

        /* calculate distance between both players */
        var dist = Math.abs(players[1][1]) + players[0][1] + 5;

        /* add scenery rectangles at edges of game area */
        scenery = [
            [-temp_half_width - 5, -205 - temp_half_height,                     5, dist],/* left wall */
            [     temp_half_width, -205 - temp_half_height,                     5, dist],/* right wall */
            [    -temp_half_width, -205 - temp_half_height,  temp_half_width - 90,    5],/* top left wall */
            [     temp_half_width, -205 - temp_half_height, -temp_half_width + 90,    5],/* top right wall */
            [    -temp_half_width,  200 + temp_half_height,  temp_half_width - 90,    5],/* bottom left wall */
            [     temp_half_width,  200 + temp_half_height, -temp_half_width + 90,    5]/* bottom right wall */
        ];

        /* if number of spawners > 0, add spawners */
        if(settings[2] > 0){
            i = settings[2] - 1;
            do{
                var temp0 = random_number(temp_half_width * 2) - temp_half_width;/* new spawner center_x */
                var temp1 = random_number((dist - 25) / 4);/* new spawner center_y */

                /* add new spawner */
                spawners.push([
                    temp0,
                    temp1
                ]);

                /* add mirrored version of new spawner */
                spawners.push([
                    -temp0,
                    -temp1
                ]);
            }while(i--);
        }

        /* if number of obstacles > 0, add obstacles */
        if(settings[1] > 0){
            i = settings[1] - 1;
            do{
                var temp0 = random_number(temp_half_width * 2) - temp_half_width;/* new obstacle center_x */
                var temp1 = random_number((dist - 25) / 2);/* new obstacle center_y */
                var temp2 = random_number(settings[8]) + 5;/* new obstacle width */
                var temp3 = random_number(settings[8]) + 5;/* new obstacle height */

                /* add new obstacle */
                obstacles.push([
                    temp0 - temp2 / 2,
                    temp1 - temp3 / 2,
                    temp2,
                    temp3
                ]);

                /* add mirrored verison of new obstacle */
                obstacles.push([
                    -temp0 - temp2 / 2,
                    -temp1 - temp3 / 2,
                    temp2,
                    temp3
                ]);
            }while(i--);
        }

        /* if it's a newgame from the main menu, setup canvas */
        if(newgame){
            get('page').innerHTML = '<canvas id=canvas></canvas>';

            buffer = get('buffer').getContext('2d');
            canvas = get('canvas').getContext('2d');

            resize();
        }

        interval = setInterval(
            'draw()',
            settings[3]/* ms-per-frame */
        );

    /* main menu mode */
    }else{
        buffer = 0;
        canvas = 0;

        get('page').innerHTML = '<div style="border-right:8px solid #222;display:inline-block;text-align:left;vertical-align:top"><div class=c><b>Particleball</b></div><hr><div class=c><b>Generate Level:</b><ul><li><a onclick="setmode(1, 1)">AI vs AI</a><li><a onclick="setmode(2, 1)">Player vs AI</a></ul></div><hr><div class=c><input id=gamearea-height size=1 type=text value='
            + settings[5] + '>*2+100 Height<br><input id=number-of-obstacles size=1 type=text value='
            + settings[1] + '>*2 Obstacles<br><input id=obstacle-size size=1 type=text value='
            + settings[8] + '>+5>Obstacle Size<br><input id=number-of-particles size=1 type=text value='
            + settings[4] + '>Particles<br><input id=particle-speed size=1 type=text value='
            + settings[7] + '>&gt;Particle Speed<br><input id=number-of-spawners size=1 type=text value='
            + settings[2] + '>*2 Spawners<br><input id=gamearea-width size=1 type=text value='
            + settings[6] + '>*2+100 Width</div></div></div><div style=display:inline-block;text-align:left><div class=c><input disabled size=3 style=border:0 type=text value=ESC>Main Menu<br><input id=move-keys maxlength=2 size=3 type=text value='
            + settings[10] + '>Move ←→<br><input id=restart-key maxlength=1 size=3 type=text value='
            + settings[11] + '>Restart</div><hr><div class=c><input id=audio-volume max=1 min=0 step=.01 type=range value='
            + settings[0] + '>Audio<br><label><input '
            + (settings[9] ? 'checked ' : '') + 'id=clear type=checkbox>Clear</label><br><a onclick="if(confirm(\'Reset settings?\')){get(\'particle-speed\').value=1.5;get(\'clear\').checked=get(\'audio-volume\').value=1;get(\'move-keys\').value=\'AD\';get(\'restart-key\').value=\'H\';get(\'number-of-obstacles\').value=10;get(\'obstacle-size\').value=65;get(\'number-of-spawners\').value=3;get(\'ms-per-frame\').value=25;get(\'number-of-particles\').value=100;get(\'gamearea-height\').value=200;get(\'gamearea-width\').value=420;save();setmode(0,1)}">Reset Settings</a><br><a onclick="get(\'hz\').style.display=get(\'hz\').style.display===\'none\'?\'inline\':\'none\'">Hack</a><span id=hz style=display:none><br><br><input id=ms-per-frame size=1 type=text value='
            + settings[3] + '>ms/Frame</span></div></div>';
    }
}

var buffer = 0;
var canvas = 0;
var height = 0;
var i = 0;
var interval = 0;
var j = 0;
var key_left = 0;
var key_right = 0;
var ls = window.localStorage;
var mode = 0;
var obstacles = [];
var pa = 1;
var particles = [];
var particle_x_limit = 0;
var players = [];
var p0_move = 0;
var p1_move = 0;
var scenery = [];
var settings = [
    ls.getItem('particleball-0') === null ? 1 : parseFloat(ls.getItem('particleball-0')),/* audio volume */
    ls.getItem('particleball-1') === null ? 10 : parseFloat(ls.getItem('particleball-1')),/* number of obstacles */
    ls.getItem('particleball-2') === null ? 3 : parseFloat(ls.getItem('particleball-2')),/* number of spawners */
    ls.getItem('particleball-3') === null ? 25 : parseFloat(ls.getItem('particleball-3')),/* ms-per-frame */
    ls.getItem('particleball-4') === null ? 100 : parseFloat(ls.getItem('particleball-4')),/* max particles */
    ls.getItem('particleball-5') === null ? 200 : parseFloat(ls.getItem('particleball-5')),/* game area height */
    ls.getItem('particleball-6') === null ? 420 : parseFloat(ls.getItem('particleball-6')),/* game area width */
    ls.getItem('particleball-7') === null ? 1.5 : parseFloat(ls.getItem('particleball-7')),/* max particle speed */
    ls.getItem('particleball-8') === null ? 65 : parseFloat(ls.getItem('particleball-8')),/* max obstacle width/height */
    ls.getItem('particleball-9') === null,/* clear? */
    ls.getItem('particleball-10') === null ? 'AD' : ls.getItem('particleball-10'),/* movement keys */
    ls.getItem('particleball-11') === null ? 'H' : ls.getItem('particleball-11')/* restart key */
];
var spawners = [];
var x = 0;
var width = 0;
var y = 0;

setmode(0, 1);

window.onkeydown = function(e){
    if(mode > 0){
        i = window.event ? event : e;
        i = i.charCode ? i.charCode : i.keyCode;

        if(String.fromCharCode(i) === settings[10][0]){/* move left key */
            key_left = 1;

        }else if(String.fromCharCode(i) === settings[10][1]){/* move right key */
            key_right = 1;

        }else if(String.fromCharCode(i) === settings[11]){/* restart key */
            setmode(mode, 0);

        }else if(i === 27){/* ESC */
            setmode(0, 1);
        }
    }
};

window.onkeyup = function(e){
    i = window.event ? event : e;
    i = i.charCode ? i.charCode : i.keyCode;

    if(String.fromCharCode(i) === settings[10][0]){/* move left key */
        key_left = 0;

    }else if(String.fromCharCode(i) === settings[10][1]){/* move right key */
        key_right = 0;
    }
};

window.onresize = resize;
