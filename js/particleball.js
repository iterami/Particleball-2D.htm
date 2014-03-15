function draw(){
    if(settings[9]){// clear?
        buffer.clearRect(
          0,
          0,
          width,
          height
        );
    }

    // draw precalculated static obstacles
    buffer.drawImage(
      document.getElementById('buffer-static'),
      0,
      0
    );

    // move red player paddle, prevent from moving past goal boundaries
    players[1][0] += p1_move;
    if(players[1][0] > 20){
        players[1][0] = 20;
    }else if(players[1][0] < -90){
        players[1][0] = -90;
    }

    // if player controlled, handle keypress movement
    if(ai_or_player){
        if(key_left && players[0][0] > -90){
            players[0][0] -= 2;
        }else if(players[0][0] < -90){
            players[0][0] = -90;
        }
        if(key_right && players[0][0] < 20){
            players[0][0] += 2;
        }else if(players[0][0] > 20){
            players[0][0] = 20;
        }

    // else move via AI
    }else{
        players[0][0] += p0_move;
        if(players[0][0] > 20){
            players[0][0] = 20;
        }else if(players[0][0] < -90){
            players[0][0] = -90;
        }
    }

    i = spawners.length - 1;
    if(i >= 0){
        // if current number of particles is less than max, add new particle
        if(particles.length < settings[4]){
            // pick a random spawner
            i = random_number(spawners.length);

            // add particle
            particles.push([
              spawners[i][0],// particle x
              spawners[i][1],// particle y
              Math.random() * (settings[7] * 2) - settings[7],// particle x speed
              Math.random() * (settings[7] * 2) - settings[7],// particle y speed
              -1// not linked to a player
            ]);
        }
    }

    i = particles.length - 1;
    if(i >= 0){
        // reset movements for recalculation
        p0_move = -1;
        p1_move = -1;

        do{
            // if particle is with 90 pixels of center of goal
            if(particles[i][0] < 90 && particles[i][0] > -90){
                // if particle is moving downwards
                if(particles[i][3] > 0){
                    // link player 0 AI to track this particle if it is closest
                    if((p0_move === -1 || particles[i][1] > particles[p0_move][1])
                      && particles[i][1] < players[0][1]){
                        p0_move = i;
                    }

                // else link player 1 AI to track this particle if it is closest
                }else if((p1_move === -1 || particles[i][1] < particles[p1_move][1])
                  && particles[i][1] > players[1][1]){
                    p1_move = i;
                }
            }

            // if particle has collided with a goal
            if(particles[i][1]+2 > players[0][8]
              || particles[i][1]-2 < players[1][8] + players[1][10]){
                // determine which player scored a goal
                var temp_player = 0;
                if(particles[i][1] + 2 > players[0][8]){
                    temp_player = 1;
                }

                // decrease the other players score by 1 if it is greater than 0
                if(players[1 - temp_player][11] > 0){
                    players[1 - temp_player][11] -= 1;
                }

                // increase the scoring players score by 1
                if(particles[i][4] === temp_player){
                    players[temp_player][11] += 1;
                }

                // delete the particle
                particles.splice(i, 1);

                p0_move = 0;
                p1_move = 0;

            }else{
                // loop through obstacles to find collisions
                j = obstacles.length - 1;
                if(j >= 0){
                    do{
                        // x collisions
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

                        // y collisions
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

                // check for collisions with player paddles or edges of game area
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
                        // left/right wall collisions
                        if((particles[i][2] < 0 && particles[i][0] - 2 <= -particle_x_limit)
                         || (particles[i][2] > 0 && particles[i][0] + 2 >= particle_x_limit)){
                            particles[i][2] *= -1;
                        }

                        // player paddle collisions
                        if((particles[i][3] < 0 && particles[i][1] - 2 <= players[1][1] + players[1][3])
                         || (particles[i][3] > 0 && particles[i][1] + 2 >= players[0][1])){
                            particles[i][3] *= -1;
                        }
                    }
                }
                // move particles
                particles[i][0] += particles[i][2];
                particles[i][1] += particles[i][3];
            }
            // draw particles, #ddd if they are unclaimed and #player_color if they are claimed
            buffer.fillStyle = particles[i][4] < 0
              ? '#ddd'
              : ['#2d8930', '#c83232'][particles[i][4]];
            buffer.fillRect(
              particles[i][0] + x - 2,
              particles[i][1] + y - 2,
              4,
              4
            );
        }while(i--);

        // calculate movement direction for next frame if player0 ai is tracking a particle
        i = players[0][0] + players[0][2] / 2;
        if(p0_move === -1){
            if(i === 0){
                p0_move = 0;

            }else{
                p0_move = i < 0
                  ? 2
                  : -2;
            }

        }else{
            p0_move = particles[p0_move][0] > i
              ? 2
              : -2;
        }

        // calculate movement direction for next frame if player1 ai is tracking a particle
        i = players[1][0] + players[1][2] / 2;
        if(p1_move === -1){
            if(i === 0){
                p1_move = 0;

            }else{
                p1_move = i < 0
                  ? 2
                  : -2;
            }
 
        }else{
            p1_move = particles[p1_move][0] > i
              ? 2
              : -2;
        }
    }

    // setup text display
    buffer.textAlign = 'center';
    buffer.font = '23pt sans-serif';

    i = players.length - 1;
    if(i >= 0){
        do{
            // set color to player color
            buffer.fillStyle = 'rgb(' + players[i][4] + ', '
              + players[i][5] + ', '
              + players[i][6] + ')';

            // draw paddle
            buffer.fillRect(
              players[i][0] + x,
              players[i][1] + y,
              players[i][2],
              players[i][3]
            );

            // draw goal
            buffer.fillRect(
              players[i][7] + x,
              players[i][8] + y,
              players[i][9],
              players[i][10]
            );

            // draw score
            buffer.fillText(
              'Score: ' + players[i][11] + '/20',
              players[i][0] + x + players[i][2] / 2,
              players[i][1] + y + (i === 0 ? 60 : -35)
            );
        }while(i--);
    }

    // if either player has 20 or more points and 2 more points than the other player
    if(players[0][11] >= 20
      && players[0][11] > players[1][11] + 1){
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

    }else if(players[1][11] >= 20
      && players[1][11] > players[0][11] + 1){
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
    
    if(settings[9]){// clear?
        canvas.clearRect(
          0,
          0,
          width,
          height
        );
    }
    canvas.drawImage(
      document.getElementById('buffer'),
      0,
      0
    );
}

function play_audio(i){
    if(settings[0] > 0){
        document.getElementById(i).currentTime = 0;
        document.getElementById(i).play();
    }
}

function resize(){
    if(mode > 0){
        width = window.innerWidth;
        document.getElementById('buffer').width = width;
        document.getElementById('buffer-static').width = width;
        document.getElementById('canvas').width = width;

        height = window.innerHeight;
        document.getElementById('buffer').height = height;
        document.getElementById('buffer-static').height = height;
        document.getElementById('canvas').height = height;

        x = width / 2;
        y = height / 2;

        update_static_buffer();
    }
}

function random_number(i){
    return Math.floor(Math.random() * i);
}

function reset(){
    if(confirm('Reset settings?')){
        document.getElementById('audio-volume').value = 1;
        document.getElementById('clear').checked = 1;
        document.getElementById('gamearea-height').value = 200;
        document.getElementById('gamearea-width').value = 420;
        document.getElementById('move-keys').value = 'AD';
        document.getElementById('ms-per-frame').value = 25;
        document.getElementById('number-of-obstacles').value = 10;
        document.getElementById('number-of-particles').value = 100;
        document.getElementById('number-of-spawners').value = 3;
        document.getElementById('obstacle-size').value = 65;
        document.getElementById('particle-speed').value = 1.5;
        document.getElementById('restart-key').value = 'H';
        save();
    }
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

        if(isNaN(document.getElementById(j).value)
          || document.getElementById(j).value === [1, 10, 3, 25, 100, 200, 420, 1.5, 65][i]){
            window.localStorage.removeItem('particleball-' + i);
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
            document.getElementById(j).value = settings[i];

        }else{
            settings[i] = parseFloat(document.getElementById(j).value);
            window.localStorage.setItem(
              'particleball-' + i,
              settings[i]
            );
        }
    }while(i--);

    // save clear setting, if it is not checked
    settings[9] = document.getElementById('clear').checked;
    if(settings[9]){
        window.localStorage.removeItem('particleball-9');

    }else{
        window.localStorage.setItem(
          'particleball-9',
          0
        );
    }

    // save move-keys and restart-key, if they differ from default
    i = 1;
    do{
        if(document.getElementById(['move-keys', 'restart-key'][i]).value === ['AD', 'H'][i]){
            window.localStorage.removeItem('particleball-' + (i + 10));
            settings[i + 10] = [
              'AD',
              'H'
            ][i];

        }else{
            settings[i + 10] = document.getElementById(['move-keys', 'restart-key'][i]).value;
            window.localStorage.setItem(
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

    // new game mode
    if(mode > 0){
        // if mode is 1, ai vs ai, if mode is 2, player vs ai
        ai_or_player = mode - 1;

        // if it's a newgame from the main menu, save settings
        if(newgame){
            save()
        }

        // reset keypresses
        key_left = 0;
        key_right = 0;

        // get half of width and height of game area
        arena_halfwidth = settings[6] + 100;
        arena_halfheight = settings[5] - 150;

        // particle_x_limit is how far particles can go on x axis positive or negative
        particle_x_limit = arena_halfwidth;

        // setup player information
        players = [
            // player0 (green, human or AI)
            [
              -35,// paddle top left x
              200 + arena_halfheight,// paddle top left y
              70,// paddle width
              5,// paddle height
              34,// player red rgb value
              102,// player green rgb value
              34,// player blue rgb value
              -100,// goal top left x
              210 + arena_halfheight,// goal top left y
              200,// goal width
              20,// goal height
              0// score
            ],

            // player1 (red, AI)
            [
              -35,// paddle top left x
              -205 - arena_halfheight,// paddle top left y
              70,// paddle width
              5,// paddle height
              200,// player red rgb value
              50,// player green rgb value
              50,// player blue rgb value
              -100,// goal top left x
              -230 - arena_halfheight,// goal top left y
              200,// goal width
              20,// goal height
              0// score
            ]
        ];

        // calculate distance between both players
        arena_playerdist = Math.abs(players[1][1]) + players[0][1] + 5;

        // if number of spawners > 0, add spawners
        if(settings[2] > 0){
            i = settings[2] - 1;
            do{
                var temp0 = random_number(arena_halfwidth * 2) - arena_halfwidth;// new spawner center_x
                var temp1 = random_number((arena_playerdist - 25) / 4);// new spawner center_y

                // add new spawner
                spawners.push([
                  temp0,
                  temp1
                ]);

                // add mirrored version of new spawner
                spawners.push([
                  -temp0,
                  -temp1
                ]);
            }while(i--);
        }

        // if number of obstacles > 0, add obstacles
        if(settings[1] > 0){
            i = settings[1] - 1;
            do{
                var temp0 = random_number(arena_halfwidth * 2) - arena_halfwidth;// new obstacle center_x
                var temp1 = random_number((arena_playerdist - 25) / 2);// new obstacle center_y
                var temp2 = random_number(settings[8]) + 5;// new obstacle width
                var temp3 = random_number(settings[8]) + 5;// new obstacle height

                // add new obstacle
                obstacles.push([
                  temp0 - temp2 / 2,
                  temp1 - temp3 / 2,
                  temp2,
                  temp3
                ]);

                // add mirrored verison of new obstacle
                obstacles.push([
                  -temp0 - temp2 / 2,
                  -temp1 - temp3 / 2,
                  temp2,
                  temp3
                ]);
            }while(i--);
        }

        // if it's a newgame from the main menu, setup canvas and buffers
        if(newgame){
            document.getElementById('page').innerHTML = '<canvas id=canvas></canvas>';

            buffer = document.getElementById('buffer').getContext('2d');
            buffer_static = document.getElementById('buffer-static').getContext('2d');
            canvas = document.getElementById('canvas').getContext('2d');

            resize();
        }

        // draw static obstacles to static buffer to optimize
        update_static_buffer();

        interval = setInterval(
          'draw()',
          settings[3]// milliseconds per frame
        );

    // main menu mode
    }else{
        buffer = 0;
        buffer_static = 0;
        canvas = 0;

        document.getElementById('page').innerHTML = '<div style=display:inline-block;text-align:left;vertical-align:top><div class=c><b>Particleball</b></div><hr><div class=c><b>Generate Level:</b><ul><li><a onclick="setmode(1, 1)">AI vs AI</a><li><a onclick="setmode(2, 1)">Player vs AI</a></ul></div></div></div><div style="border-left:8px solid #222;display:inline-block;text-align:left"><div class=c><input disabled style=border:0 value=ESC>Main Menu<br><input id=move-keys maxlength=2 value='
          + settings[10] + '>Move ←→<br><input id=restart-key maxlength=1 value='
          + settings[11] + '>Restart</div><hr><div class=c><input id=audio-volume max=1 min=0 step=.01 type=range value='
          + settings[0] + '>Audio<br><label><input '
          + (settings[9] ? 'checked ' : '') + 'id=clear type=checkbox>Clear</label><br><input id=gamearea-height value='
          + settings[5] + '>*2+100 Height<br><input id=ms-per-frame value='
          + settings[3] + '>ms/Frame<br><input id=number-of-obstacles value='
          + settings[1] + '>*2 Obstacles<br><input id=obstacle-size value='
          + settings[8] + '>+5>Obstacle Size<br><input id=number-of-particles value='
          + settings[4] + '>Particles<br><input id=particle-speed value='
          + settings[7] + '>&gt;Particle Speed<br><input id=number-of-spawners value='
          + settings[2] + '>*2 Spawners<br><input id=gamearea-width value='
          + settings[6] + '>*2+100 Width<br><a onclick=reset()>Reset Settings</a></div></div>';
    }
}

function update_static_buffer(){
    buffer_static.clearRect(
      0,
      0,
      width,
      height
    );

    // draw obstacles
    buffer_static.fillStyle = '#3c3c3c';
    i = obstacles.length - 1;
    if(i >= 0){
        do{
            buffer_static.fillRect(
              obstacles[i][0] + x,
              obstacles[i][1] + y,
              obstacles[i][2],
              obstacles[i][3]
            );
        }while(i--);
    }

    // draw scenery rectangles at edges of game area
    buffer_static.fillRect(
      x - arena_halfwidth - 5,
      y - 205 - arena_halfheight,
      5,
      arena_playerdist
    );
    buffer_static.fillRect(
      x + arena_halfwidth,
      y - 205 - arena_halfheight,
      5,
      arena_playerdist
    );
    buffer_static.fillRect(
      x - arena_halfwidth,
      y - 205 - arena_halfheight,
      arena_halfwidth - 90,
      5
    );
    buffer_static.fillRect(
      x + arena_halfwidth,
      y - 205 - arena_halfheight,
      90 - arena_halfwidth,
      5
    );
    buffer_static.fillRect(
      x - arena_halfwidth,
      y + 200 + arena_halfheight,
      arena_halfwidth - 90,
      5
    );
    buffer_static.fillRect(
      x + arena_halfwidth,
      y + 200 + arena_halfheight,
      90 - arena_halfwidth,
      5
    );

    // draw spawners
    i = spawners.length - 1;
    if(i >= 0){
        buffer_static.fillStyle = '#476291';
        do{
            buffer_static.fillRect(
              spawners[i][0] + x - 4,
              spawners[i][1] + y - 4,
              8,
              8
            );
        }while(i--);
    }
}

var arena_halfheight = 0;
var arena_halfwidth = 0;
var arena_playerdist = 0;
var buffer = 0;
var buffer_static = 0;
var canvas = 0;
var height = 0;
var i = 0;
var interval = 0;
var j = 0;
var key_left = 0;
var key_right = 0;
var mode = 0;
var obstacles = [];
var pa = 1;
var particles = [];
var particle_x_limit = 0;
var players = [];
var p0_move = 0;
var p1_move = 0;
var settings = [
  window.localStorage.getItem('particleball-0') === null
    ? 1
    : parseFloat(window.localStorage.getItem('particleball-0')),// audio volume
  window.localStorage.getItem('particleball-1') === null
    ? 10
    : parseFloat(window.localStorage.getItem('particleball-1')),// number of obstacles
  window.localStorage.getItem('particleball-2') === null
    ? 3
    : parseFloat(window.localStorage.getItem('particleball-2')),// number of spawners
  window.localStorage.getItem('particleball-3') === null
    ? 25
    : parseFloat(window.localStorage.getItem('particleball-3')),// milliseconds per frame
  window.localStorage.getItem('particleball-4') === null
    ? 100
    : parseFloat(window.localStorage.getItem('particleball-4')),// max particles
  window.localStorage.getItem('particleball-5') === null
    ? 200
    : parseFloat(window.localStorage.getItem('particleball-5')),// game area height
  window.localStorage.getItem('particleball-6') === null
    ? 420
    : parseFloat(window.localStorage.getItem('particleball-6')),// game area width
  window.localStorage.getItem('particleball-7') === null
    ? 1.5
    : parseFloat(window.localStorage.getItem('particleball-7')),// max particle speed
  window.localStorage.getItem('particleball-8') === null
    ? 65
    : parseFloat(window.localStorage.getItem('particleball-8')),// max obstacle width/height
  window.localStorage.getItem('particleball-9')  === null,// clear?
  window.localStorage.getItem('particleball-10') === null
    ? 'AD'
    : window.localStorage.getItem('particleball-10'),// movement keys
  window.localStorage.getItem('particleball-11') === null
    ? 'H'
    : window.localStorage.getItem('particleball-11')// restart key
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

        if(String.fromCharCode(i) === settings[10][0]){// move left key
            key_left = 1;

        }else if(String.fromCharCode(i) === settings[10][1]){// move right key
            key_right = 1;

        }else if(String.fromCharCode(i) === settings[11]){// restart key
            setmode(mode, 0);

        }else if(i === 27){// ESC
            setmode(0, 1);
        }
    }
};

window.onkeyup = function(e){
    i = window.event ? event : e;
    i = i.charCode ? i.charCode : i.keyCode;

    if(String.fromCharCode(i) === settings[10][0]){// move left key
        key_left = 0;

    }else if(String.fromCharCode(i) === settings[10][1]){// move right key
        key_right = 0;
    }
};

window.onresize = resize;
