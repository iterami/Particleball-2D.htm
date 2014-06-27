function create_obstacle(obstacle_x, obstacle_y){
    var obstacle_height = random_number(settings[8]) + 5;// new obstacle height
    var obstacle_width = random_number(settings[8]) + 5;// new obstacle width

    // add new obstacle
    obstacles.push([
      obstacle_x - obstacle_width / 2,
      obstacle_y - obstacle_height / 2,
      obstacle_width,
      obstacle_height
    ]);

    // add mirrored verison of new obstacle
    obstacles.push([
      -obstacle_x - obstacle_width / 2,
      -obstacle_y - obstacle_height / 2,
      obstacle_width,
      obstacle_height
    ]);
}

function draw(){
    if(settings[10]){// clear?
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
        if(key_left
          && players[0][0] > -90){
            players[0][0] -= 2;
        }else if(players[0][0] < -90){
            players[0][0] = -90;
        }
        if(key_right
          && players[0][0] < 20){
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

    if(spawners.length - 1 >= 0){
        // if current number of particles is less than max, add new particle
        if(particles.length < settings[4]){
            // pick a random spawner
            var random_spawner = random_number(spawners.length);

            // add particle
            particles.push([
              spawners[random_spawner][0],// particle x
              spawners[random_spawner][1],// particle y
              Math.random() * (settings[7] * 2) - settings[7],// particle x speed
              Math.random() * (settings[7] * 2) - settings[7],// particle y speed
              -1// not linked to a player
            ]);
        }
    }

    var loop_counter = particles.length - 1;
    if(loop_counter >= 0){
        // reset movements for recalculation
        p0_move = -1;
        p1_move = -1;

        do{
            // if particle is with 90 pixels of center of goal
            if(particles[loop_counter][0] < 90
              && particles[loop_counter][0] > -90){
                // if particle is moving downwards
                if(particles[loop_counter][3] > 0){
                    // link player 0 AI to track this particle if it is closest
                    if((p0_move === -1 || particles[loop_counter][1] > particles[p0_move][1])
                      && particles[loop_counter][1] < players[0][1]){
                        p0_move = loop_counter;
                    }

                // else link player 1 AI to track this particle if it is closest
                }else if((p1_move === -1 || particles[loop_counter][1] < particles[p1_move][1])
                  && particles[loop_counter][1] > players[1][1]){
                    p1_move = loop_counter;
                }
            }

            // if particle has collided with a goal
            if(particles[loop_counter][1]+2 > players[0][8]
              || particles[loop_counter][1]-2 < players[1][8] + players[1][10]){
                // determine which player scored a goal
                var temp_player = 0;
                if(particles[loop_counter][1] + 2 > players[0][8]){
                    temp_player = 1;
                }

                // decrease the other players score by 1 if it is greater than 0
                if(players[1 - temp_player][11] > 0){
                    players[1 - temp_player][11] -= 1;
                }

                // increase the scoring players score by 1
                if(particles[loop_counter][4] === temp_player){
                    players[temp_player][11] += 1;
                }

                // delete the particle
                particles.splice(
                  loop_counter,
                  1
                );

                p0_move = 0;
                p1_move = 0;

            }else{
                // loop through obstacles to find collisions
                j = obstacles.length - 1;
                if(j >= 0){
                    do{
                        // x collisions
                        if(particles[loop_counter][0] >= obstacles[j][0]
                          && particles[loop_counter][0] <= obstacles[j][0] + obstacles[j][2]){
                            if(particles[loop_counter][3] > 0){
                                if(particles[loop_counter][1] > obstacles[j][1] - 2
                                  && particles[loop_counter][1] < obstacles[j][1]){
                                    particles[loop_counter][3] *= -1;
                                }
                            }else if(particles[loop_counter][1] > obstacles[j][1] + obstacles[j][3]
                              && particles[loop_counter][1] < obstacles[j][1] + obstacles[j][3] + 2){
                                particles[loop_counter][3] *= -1;
                            }

                        // y collisions
                        }else if(particles[loop_counter][1] >= obstacles[j][1]
                          && particles[loop_counter][1] <= obstacles[j][1] + obstacles[j][3]){
                            if(particles[loop_counter][2] > 0){
                                if(particles[loop_counter][0] > obstacles[j][0] - 2
                                  && particles[loop_counter][0] < obstacles[j][0]){
                                    particles[loop_counter][2] *= -1;
                                }

                            }else if(particles[loop_counter][0] > obstacles[j][0] + obstacles[j][2]
                              && particles[loop_counter][0] < obstacles[j][0] + obstacles[j][2] + 2){
                                particles[loop_counter][2] *= -1;
                            }
                        }
                    }while(j--);
                }

                // check for collisions with player paddles or edges of game area
                if(particles[loop_counter][1] > players[1][1] + players[1][3]
                  && particles[loop_counter][1] < players[0][1]){
                    if(particles[loop_counter][0] > -88
                      && particles[loop_counter][0] < 88){
                        if(particles[loop_counter][1] > 0){
                            if(particles[loop_counter][0] > players[0][0] - 2
                              && particles[loop_counter][0] < players[0][0] + players[0][2] + 2){
                                if(particles[loop_counter][3] > 0
                                  && particles[loop_counter][1] + 2 >= players[0][1]){
                                    particles[loop_counter][2] = Math.random() * (settings[7] * 2) - settings[7];
                                    particles[loop_counter][3] *= -1;
                                    particles[loop_counter][4] = 0;
                                }
                            }

                        }else if(particles[loop_counter][0] > players[1][0]- 2
                          && particles[loop_counter][0] < players[1][0] + players[1][2] + 2
                          && particles[loop_counter][3] < 0
                          && particles[loop_counter][1] - 2 <= players[1][1] + players[1][3]){
                            particles[loop_counter][3] *= -1;
                            particles[loop_counter][4] = 1;
                        }

                    }else{
                        // left/right wall collisions
                        if((particles[loop_counter][2] < 0 && particles[loop_counter][0] - 2 <= -particle_x_limit)
                         || (particles[loop_counter][2] > 0 && particles[loop_counter][0] + 2 >= particle_x_limit)){
                            particles[loop_counter][2] *= -1;
                        }

                        // player paddle collisions
                        if((particles[loop_counter][3] < 0 && particles[loop_counter][1] - 2 <= players[1][1] + players[1][3])
                         || (particles[loop_counter][3] > 0 && particles[loop_counter][1] + 2 >= players[0][1])){
                            particles[loop_counter][3] *= -1;
                        }
                    }
                }
                // move particles
                particles[loop_counter][0] += particles[loop_counter][2];
                particles[loop_counter][1] += particles[loop_counter][3];
            }
            // draw particles, #ddd if they are unclaimed and #player_color if they are claimed
            buffer.fillStyle = particles[loop_counter][4] < 0
              ? '#ddd'
              : ['#2d8930', '#c83232'][particles[loop_counter][4]];
            buffer.fillRect(
              particles[loop_counter][0] + x - 2,
              particles[loop_counter][1] + y - 2,
              4,
              4
            );
        }while(loop_counter--);

        // calculate movement direction for next frame if player0 ai is tracking a particle
        var paddle_position = players[0][0] + players[0][2] / 2;
        if(p0_move === -1){
            if(paddle_position === 0){
                p0_move = 0;

            }else{
                p0_move = paddle_position < 0
                  ? 2
                  : -2;
            }

        }else{
            p0_move = particles[p0_move][0] > paddle_position
              ? 2
              : -2;
        }

        // calculate movement direction for next frame if player1 ai is tracking a particle
        paddle_position = players[1][0] + players[1][2] / 2;
        if(p1_move === -1){
            if(paddle_position === 0){
                p1_move = 0;

            }else{
                p1_move = paddle_position < 0
                  ? 2
                  : -2;
            }
 
        }else{
            p1_move = particles[p1_move][0] > paddle_position
              ? 2
              : -2;
        }
    }

    // setup text display
    buffer.textAlign = 'center';
    buffer.font = '23pt sans-serif';

    loop_counter = players.length - 1;
    if(loop_counter >= 0){
        do{
            // set color to player color
            buffer.fillStyle = 'rgb('
              + players[loop_counter][4] + ', '
              + players[loop_counter][5] + ', '
              + players[loop_counter][6] + ')';

            // draw paddle
            buffer.fillRect(
              players[loop_counter][0] + x,
              players[loop_counter][1] + y,
              players[loop_counter][2],
              players[loop_counter][3]
            );

            // draw goal
            buffer.fillRect(
              players[loop_counter][7] + x,
              players[loop_counter][8] + y,
              players[loop_counter][9],
              players[loop_counter][10]
            );

            // draw score
            buffer.fillText(
              'Score: ' + players[loop_counter][11] + '/' + settings[9],
              players[loop_counter][0] + x + players[loop_counter][2] / 2,
              players[loop_counter][1] + y + (loop_counter === 0 ? 60 : -35)
            );
        }while(loop_counter--);
    }

    // if either player has 20 or more points and 2 more points than the other player
    if(players[0][11] >= settings[9]
      || players[1][11] >= settings[9]){
        clearInterval(interval);

        buffer.fillStyle = '#fff';
        buffer.fillText(
          settings[12] + ' = Restart',
          x,
          y / 2 + 50
        );
        buffer.fillText(
          'ESC = Main Menu',
          x,
          y / 2 + 90
        );

        if(players[0][11] > players[1][11]){
            buffer.fillStyle = '#262';
            buffer.fillText(
              ai_or_player
                ? 'You win! ☺'
                : 'Green player wins!',
              x,
              y / 2
            );

        }else{
            buffer.fillStyle = '#c83232';
            buffer.fillText(
              ai_or_player
                ? 'You lose. ☹'
                : 'Red player wins!',
              x,
              y / 2
            );
        }

    }
    
    if(settings[10]){// clear?
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
        height = window.innerHeight;
        document.getElementById('buffer').height = height;
        document.getElementById('buffer-static').height = height;
        document.getElementById('canvas').height = height;
        y = height / 2;

        width = window.innerWidth;
        document.getElementById('buffer').width = width;
        document.getElementById('buffer-static').width = width;
        document.getElementById('canvas').width = width;
        x = width / 2;

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
        document.getElementById('score-goal').value = 20;
        save();
    }
}

function save(){
    var loop_counter = 9;
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
          'obstacle-size',
          'score-goal'
        ][loop_counter];

        if(isNaN(document.getElementById(j).value)
          || document.getElementById(j).value === [1, 10, 3, 25, 100, 200, 420, 1.5, 65, 20][loop_counter]){
            window.localStorage.removeItem('particleball-' + loop_counter);
            settings[loop_counter] = [
              1,
              10,
              3,
              25,
              100,
              200,
              420,
              1.5,
              65,
              20
            ][loop_counter];
            document.getElementById(j).value = settings[loop_counter];

        }else{
            settings[loop_counter] = parseFloat(document.getElementById(j).value);
            window.localStorage.setItem(
              'particleball-' + loop_counter,
              settings[loop_counter]
            );
        }
    }while(loop_counter--);

    // save clear setting, if it is not checked
    settings[10] = document.getElementById('clear').checked;
    if(settings[10]){
        window.localStorage.removeItem('particleball-10');

    }else{
        window.localStorage.setItem(
          'particleball-10',
          0
        );
    }

    // save move-keys and restart-key, if they differ from default
    loop_counter = 1;
    do{
        if(document.getElementById(['move-keys', 'restart-key'][loop_counter]).value === ['AD', 'H'][loop_counter]){
            window.localStorage.removeItem('particleball-' + (loop_counter + 11));
            settings[loop_counter + 11] = [
              'AD',
              'H'
            ][loop_counter];

        }else{
            settings[loop_counter + 11] = document.getElementById(['move-keys', 'restart-key'][loop_counter]).value;
            window.localStorage.setItem(
              'particleball-' + (loop_counter + 11),
              settings[loop_counter + 11]
            );
        }
    }while(loop_counter--);
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
            var loop_counter = settings[2] - 1;
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
            }while(loop_counter--);
        }

        // if number of obstacles > 0, add obstacles
        if(settings[1] > 0){
            var loop_counter = settings[1] - 1;
            do{
                create_obstacle(
                  random_number(arena_halfwidth * 2) - arena_halfwidth,// new obstacle center_x
                  random_number((arena_playerdist - 25) / 2)// new obstacle center_y
                );
            }while(loop_counter--);
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

        document.getElementById('page').innerHTML = '<div style=display:inline-block;text-align:left;vertical-align:top><div class=c><b>Particleball.htm</b></div><hr><div class=c><b>Generate Level:</b><ul><li><a onclick="setmode(1, 1)">AI vs AI</a><li><a onclick="setmode(2, 1)">Player vs AI</a></ul></div></div></div><div style="border-left:8px solid #222;display:inline-block;text-align:left"><div class=c><input disabled style=border:0 value=ESC>Main Menu<br><input id=move-keys maxlength=2 value='
          + settings[11] + '>Move ←→<br><input disabled style=border:0 value=Click>Obstacles++<br><input id=restart-key maxlength=1 value='
          + settings[12] + '>Restart</div><hr><div class=c><input id=audio-volume max=1 min=0 step=.01 type=range value='
          + settings[0] + '>Audio<br><label><input '
          + (settings[10] ? 'checked ' : '') + 'id=clear type=checkbox>Clear</label><br><input id=score-goal value='
          + settings[9] + '>Goal<br>Level:<ul><li><input id=gamearea-height value='
          + settings[5] + '>*2+100 Height<li><input id=gamearea-width value='
          + settings[6] + '>*2+100 Width</ul><input id=ms-per-frame value='
          + settings[3] + '>ms/Frame<br>Obstacles:<ul><li><input id=number-of-obstacles value='
          + settings[1] + '>*2 #<li><input id=obstacle-size value='
          + settings[8] + '>+5&lt;Size</ul>Particles:<ul><li><input id=number-of-particles value='
          + settings[4] + '>#<li><input id=number-of-spawners value='
          + settings[2] + '>*2 Spawners<li><input id=particle-speed value='
          + settings[7] + '>&gt;Speed</ul><a onclick=reset()>Reset Settings</a></div></div>';
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
    var loop_counter = obstacles.length - 1;
    if(loop_counter >= 0){
        do{
            buffer_static.fillRect(
              obstacles[loop_counter][0] + x,
              obstacles[loop_counter][1] + y,
              obstacles[loop_counter][2],
              obstacles[loop_counter][3]
            );
        }while(loop_counter--);
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
    loop_counter = spawners.length - 1;
    if(loop_counter >= 0){
        buffer_static.fillStyle = '#476291';
        do{
            buffer_static.fillRect(
              spawners[loop_counter][0] + x - 4,
              spawners[loop_counter][1] + y - 4,
              8,
              8
            );
        }while(loop_counter--);
    }
}

var arena_halfheight = 0;
var arena_halfwidth = 0;
var arena_playerdist = 0;
var buffer = 0;
var buffer_static = 0;
var canvas = 0;
var height = 0;
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
    : parseInt(window.localStorage.getItem('particleball-1')),// number of obstacles
  window.localStorage.getItem('particleball-2') === null
    ? 3
    : parseInt(window.localStorage.getItem('particleball-2')),// number of spawners
  window.localStorage.getItem('particleball-3') === null
    ? 25
    : parseInt(window.localStorage.getItem('particleball-3')),// milliseconds per frame
  window.localStorage.getItem('particleball-4') === null
    ? 100
    : parseInt(window.localStorage.getItem('particleball-4')),// max particles
  window.localStorage.getItem('particleball-5') === null
    ? 200
    : parseInt(window.localStorage.getItem('particleball-5')),// game area height
  window.localStorage.getItem('particleball-6') === null
    ? 420
    : parseInt(window.localStorage.getItem('particleball-6')),// game area width
  window.localStorage.getItem('particleball-7') === null
    ? 1.5
    : parseFloat(window.localStorage.getItem('particleball-7')),// max particle speed
  window.localStorage.getItem('particleball-8') === null
    ? 65
    : parseInt(window.localStorage.getItem('particleball-8')),// max obstacle width/height
  window.localStorage.getItem('particleball-9') === null
    ? 20
    : parseInt(window.localStorage.getItem('particleball-9')),// score goal
  window.localStorage.getItem('particleball-10')  === null,// clear?
  window.localStorage.getItem('particleball-11') === null
    ? 'AD'
    : window.localStorage.getItem('particleball-11'),// movement keys
  window.localStorage.getItem('particleball-12') === null
    ? 'H'
    : window.localStorage.getItem('particleball-12')// restart key
];
var spawners = [];
var x = 0;
var width = 0;
var y = 0;

setmode(0, 1);// Main Menu

window.onkeydown = function(e){
    if(mode > 0){
        var key = window.event ? event : e;
        key = key.charCode ? key.charCode : key.keyCode;

        if(key === 27){// ESC
            setmode(0, 1);// Main Menu

        }else{
            key = String.fromCharCode(key);

            if(key === settings[11][0]){// move left key
                key_left = 1;

            }else if(key === settings[11][1]){// move right key
                key_right = 1;

            }else if(key === settings[12]){// restart key
                setmode(mode, 0);

            }
        } 
    }
};

window.onkeyup = function(e){
    var key = window.event ? event : e;
    key = String.fromCharCode(key.charCode ? key.charCode : key.keyCode);

    if(key === settings[11][0]){// move left key
        key_left = 0;

    }else if(key === settings[11][1]){// move right key
        key_right = 0;
    }
};

window.onmousedown = function(e){
    // clicks create new obstacles
    if(mode > 0){
        create_obstacle(
          e.pageX - x,// new obstacle center_x
          e.pageY - y// new obstacle center_y
        );

        update_static_buffer();
    }
};

window.onresize = resize;
