function create_obstacle(obstacle_x, obstacle_y){
    var obstacle_height = Math.floor(Math.random() * settings['obstacle-size']) + 5;// new obstacle height
    var obstacle_width = Math.floor(Math.random() * settings['obstacle-size']) + 5;// new obstacle width

    // Add new obstacle.
    obstacles.push([
      obstacle_x - obstacle_width / 2,
      obstacle_y - obstacle_height / 2,
      obstacle_width,
      obstacle_height,
    ]);

    // Add mirrored verison of new obstacle.
    obstacles.push([
      -obstacle_x - obstacle_width / 2,
      -obstacle_y - obstacle_height / 2,
      obstacle_width,
      obstacle_height,
    ]);
}

function draw(){
    buffer.clearRect(
      0,
      0,
      width,
      height
    );

    // Draw precalculated static obstacles.
    buffer.drawImage(
      document.getElementById('buffer-static'),
      0,
      0
    );

    // Move red player paddle, prevent from moving past goal boundaries.
    players[1][0] += p1_move;
    if(players[1][0] > 20){
        players[1][0] = 20;
    }else if(players[1][0] < -90){
        players[1][0] = -90;
    }

    // If player controlled, handle keypress movement...
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

    // ...else move via AI.
    }else{
        players[0][0] += p0_move;
        if(players[0][0] > 20){
            players[0][0] = 20;
        }else if(players[0][0] < -90){
            players[0][0] = -90;
        }
    }

    // If spawners exist and current number of particles
    //   is less than max, add new particle.
    if(spawners.length - 1 >= 0
      && particles.length < settings['number-of-particles']){
        // Pick a random spawner.
        var random_spawner = Math.floor(Math.random() * spawners.length);

        // Add particle.
        particles.push([
          spawners[random_spawner][0],// Particle X
          spawners[random_spawner][1],// Particle Y
          Math.random() * (settings['particle-speed'] * 2) - settings['particle-speed'],// Particle X speed
          Math.random() * (settings['particle-speed'] * 2) - settings['particle-speed'],// Particle Y speed
          -1,// Not linked to a player
        ]);
    }

    var loop_counter = particles.length - 1;
    if(loop_counter >= 0){
        // Reset movements for recalculation.
        p0_move = -1;
        p1_move = -1;

        do{
            // If particle is with 90 pixels of center of goal.
            if(particles[loop_counter][0] < 90
              && particles[loop_counter][0] > -90){
                // If particle is moving downwards...
                if(particles[loop_counter][3] > 0){
                    // Link player 0 AI to track this particle if it is closest.
                    if((p0_move === -1 || particles[loop_counter][1] > particles[p0_move][1])
                      && particles[loop_counter][1] < players[0][1]){
                        p0_move = loop_counter;
                    }

                // ...else link player 1 AI to track this particle if it is closest.
                }else if((p1_move === -1 || particles[loop_counter][1] < particles[p1_move][1])
                  && particles[loop_counter][1] > players[1][1]){
                    p1_move = loop_counter;
                }
            }

            // If particle has collided with a goal.
            if(particles[loop_counter][1]+2 > players[0][8]
              || particles[loop_counter][1]-2 < players[1][8] + players[1][10]){
                // Determine which player scored a goal.
                var temp_player = 0;
                if(particles[loop_counter][1] + 2 > players[0][8]){
                    temp_player = 1;
                }

                // Decrease the other players score by 1 if it is greater than 0.
                if(players[1 - temp_player][11] > 0){
                    players[1 - temp_player][11] -= 1;
                }

                // Increase the scoring players score by 1.
                if(particles[loop_counter][4] === temp_player){
                    players[temp_player][11] += 1;
                }

                // Delete the particle.
                particles.splice(
                  loop_counter,
                  1
                );

                p0_move = 0;
                p1_move = 0;

            }else{
                // Loop through obstacles to find collisions.
                var j = obstacles.length - 1;
                if(j >= 0){
                    do{
                        // X collisions.
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

                        // Y collisions.
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

                // Check for collisions with player paddles or edges of game area.
                if(particles[loop_counter][1] > players[1][1] + players[1][3]
                  && particles[loop_counter][1] < players[0][1]){
                    if(particles[loop_counter][0] > -88
                      && particles[loop_counter][0] < 88){
                        if(particles[loop_counter][1] > 0){
                            if(particles[loop_counter][0] > players[0][0] - 2
                              && particles[loop_counter][0] < players[0][0] + players[0][2] + 2){
                                if(particles[loop_counter][3] > 0
                                  && particles[loop_counter][1] + 2 >= players[0][1]){
                                    particles[loop_counter][2] = Math.random() * (settings['particle-speed'] * 2) - settings['particle-speed'];
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

                    // Left/right wall collisions.
                    }else if((particles[loop_counter][2] < 0 && particles[loop_counter][0] - 2 <= -particle_x_limit)
                     || (particles[loop_counter][2] > 0 && particles[loop_counter][0] + 2 >= particle_x_limit)){
                        particles[loop_counter][2] *= -1;

                    // Player paddle collisions.
                    }else if((particles[loop_counter][3] < 0 && particles[loop_counter][1] - 2 <= players[1][1] + players[1][3])
                     || (particles[loop_counter][3] > 0 && particles[loop_counter][1] + 2 >= players[0][1])){
                        particles[loop_counter][3] *= -1;
                    }
                }

                // Move particles.
                particles[loop_counter][0] += particles[loop_counter][2];
                particles[loop_counter][1] += particles[loop_counter][3];
            }

            // Draw particles, #ddd if they are unclaimed and #player_color if they are claimed.
            buffer.fillStyle = particles[loop_counter][4] < 0
              ? '#ddd'
              : ['#2d8930', '#c83232',][particles[loop_counter][4]];
            buffer.fillRect(
              particles[loop_counter][0] + x - 2,
              particles[loop_counter][1] + y - 2,
              4,
              4
            );
        }while(loop_counter--);

        // Calculate movement direction for next frame if player0 ai is tracking a particle.
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

        // Calculate movement direction for next frame if player1 ai is tracking a particle.
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

    // Setup text display.
    buffer.textAlign = 'center';
    buffer.font = '23pt sans-serif';

    loop_counter = players.length - 1;
    if(loop_counter >= 0){
        do{
            // Set color to player color.
            buffer.fillStyle = 'rgb('
              + players[loop_counter][4] + ', '
              + players[loop_counter][5] + ', '
              + players[loop_counter][6] + ')';

            // Draw paddle.
            buffer.fillRect(
              players[loop_counter][0] + x,
              players[loop_counter][1] + y,
              players[loop_counter][2],
              players[loop_counter][3]
            );

            // Draw goal.
            buffer.fillRect(
              players[loop_counter][7] + x,
              players[loop_counter][8] + y,
              players[loop_counter][9],
              players[loop_counter][10]
            );

            // Draw score.
            buffer.fillText(
              'Score: ' + players[loop_counter][11] + '/' + settings['score-goal'],
              players[loop_counter][0] + x + players[loop_counter][2] / 2,
              players[loop_counter][1] + y + (loop_counter === 0 ? 60 : -35)
            );
        }while(loop_counter--);
    }

    // If either player has score-goal points and 2 more points than the other player.
    if(players[0][11] >= settings['score-goal']
      || players[1][11] >= settings['score-goal']){
        clearInterval(interval);

        buffer.fillStyle = '#fff';
        buffer.fillText(
          settings['restart-key'] + ' = Restart',
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
    
    canvas.clearRect(
      0,
      0,
      width,
      height
    );
    canvas.drawImage(
      document.getElementById('buffer'),
      0,
      0
    );
}

function play_audio(i){
    if(settings['audio-volume'] <= 0){
        return;
    }

    document.getElementById(i).currentTime = 0;
    document.getElementById(i).play();
}

function resize(){
    if(mode <= 0){
        return;
    }

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

function reset(){
    if(!confirm('Reset settings?')){
        return;
    }

    document.getElementById('audio-volume').value = 1;
    document.getElementById('gamearea-height').value = 200;
    document.getElementById('gamearea-width').value = 420;
    document.getElementById('movement-keys').value = 'AD';
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

function save(){
    var loop_counter = 9;
    do{
        var id = [
          'audio-volume',
          'gamearea-height',
          'gamearea-width',
          'ms-per-frame',
          'number-of-obstacles',
          'number-of-spawners',
          'number-of-particles',
          'obstacle-size',
          'particle-speed',
          'score-goal',
        ][loop_counter];

        if(isNaN(document.getElementById(id).value)
          || document.getElementById(id).value === [1, 200, 420, 25, 10, 3, 100, 65, 1.5, 20,][loop_counter]){
            window.localStorage.removeItem('Particleball.htm-' + id);
            settings[id] = [
              1,
              200,
              420,
              25,
              10,
              3,
              100,
              65,
              1.5,
              20,
            ][loop_counter];
            document.getElementById(id).value = settings[id];

        }else{
            settings[id] = parseFloat(document.getElementById(id).value);
            window.localStorage.setItem(
              'Particleball.htm-' + id,
              settings[id]
            );
        }
    }while(loop_counter--);

    // save movement-keys and restart-key, if they differ from default
    loop_counter = 1;
    do{
        id = [
          'movement-keys',
          'restart-key',
        ][loop_counter];

        if(document.getElementById(id).value === ['AD', 'H',][loop_counter]){
            window.localStorage.removeItem('Particleball.htm-' + id);
            settings[id] = [
              'AD',
              'H',
            ][loop_counter];

        }else{
            settings[id] = document.getElementById(id).value;
            window.localStorage.setItem(
              'Particleball.htm-' + id,
              settings[id]
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

    // New game mode.
    if(mode > 0){
        // If mode is 1, ai vs ai, if mode is 2, player vs ai.
        ai_or_player = mode - 1;

        // If it's a newgame from the main menu, save settings.
        if(newgame){
            save()
        }

        // Reset keypresses.
        key_left = false;
        key_right = false;

        // Get half of width and height of game area.
        arena_halfwidth = settings['gamearea-width'] + 100;
        arena_halfheight = settings['gamearea-height'] - 150;

        // Particle_x_limit is how far particles can go on x axis positive or negative.
        particle_x_limit = arena_halfwidth;

        // Setup player information.
        players = [
            // players[0] (green, human or AI).
            [
              -35,// paddle top left X
              200 + arena_halfheight,// Paddle top left Y
              70,// Paddle width
              5,// Paddle height
              34,// Player red RGB value
              102,// player green RGB value
              34,// Player blue RGB value
              -100,// Goal top left X
              210 + arena_halfheight,// Goal top left Y
              200,// Goal width
              20,// Goal height
              0,// Score
            ],

            // players[1] (red, AI).
            [
              -35,// Paddle top left C
              -205 - arena_halfheight,// Paddle top left Y
              70,// Paddle width
              5,// Paddle height
              200,// Player red rgb value
              50,// Player green rgb value
              50,// Player blue rgb value
              -100,// Goal top left X
              -230 - arena_halfheight,// Goal top left Y
              200,// Goal width
              20,// Goal height
              0,// Score
            ]
        ];

        // Calculate distance between both players.
        arena_playerdist = Math.abs(players[1][1]) + players[0][1] + 5;

        if(settings['number-of-spawners'] > 0){
            var loop_counter = settings['number-of-spawners'] - 1;
            do{
                var temp0 = Math.floor(Math.random() * (arena_halfwidth * 2)) - arena_halfwidth;// new spawner center_x
                var temp1 = Math.floor(Math.random() * ((arena_playerdist - 25) / 4));// new spawner center_y

                // Add new spawner.
                spawners.push([
                  temp0,
                  temp1,
                ]);

                // Add mirrored version of new spawner.
                spawners.push([
                  -temp0,
                  -temp1,
                ]);
            }while(loop_counter--);
        }

        if(settings['number-of-obstacles'] > 0){
            var loop_counter = settings['number-of-obstacles'] - 1;
            do{
                create_obstacle(
                  Math.floor(Math.random() * (arena_halfwidth * 2)) - arena_halfwidth,// New obstacle center_x
                  Math.floor(Math.random() * ((arena_playerdist - 25) / 2))// New obstacle center_y
                );
            }while(loop_counter--);
        }

        // If it's a newgame from the main menu, setup canvas and buffers.
        if(newgame){
            document.getElementById('page').innerHTML = '<canvas id=canvas></canvas><canvas id=buffer style=display:none></canvas><canvas id=buffer-static style=display:none></canvas>';

            buffer = document.getElementById('buffer').getContext('2d');
            buffer_static = document.getElementById('buffer-static').getContext('2d');
            canvas = document.getElementById('canvas').getContext('2d');

            resize();
        }

        // Draw static obstacles to static buffer to optimize.
        update_static_buffer();

        interval = setInterval(
          'draw()',
          settings['ms-per-frame']
        );

    // Main menu mode.
    }else{
        buffer = 0;
        buffer_static = 0;
        canvas = 0;

        document.getElementById('page').innerHTML = '<div style=display:inline-block;text-align:left;vertical-align:top><div class=c><b>Particleball.htm</b></div><hr><div class=c><b>Generate Level:</b><ul><li><a onclick="setmode(1, 1)">AI vs AI</a><li><a onclick="setmode(2, 1)">Player vs AI</a></ul></div></div></div><div style="border-left:8px solid #222;display:inline-block;text-align:left"><div class=c><input disabled style=border:0 value=ESC>Main Menu<br><input id=movement-keys maxlength=2 value='
          + settings['movement-keys'] + '>Move ←→<br><input disabled style=border:0 value=Click>Obstacles++<br><input id=restart-key maxlength=1 value='
          + settings['restart-key'] + '>Restart</div><hr><div class=c><input id=audio-volume max=1 min=0 step=.01 type=range value='
          + settings['audio-volume'] + '>Audio<br><input id=score-goal value='
          + settings['score-goal'] + '>Goal<br>Level:<ul><li><input id=gamearea-height value='
          + settings['gamearea-height'] + '>*2+100 Height<li><input id=gamearea-width value='
          + settings['gamearea-width'] + '>*2+100 Width</ul><input id=ms-per-frame value='
          + settings['ms-per-frame'] + '>ms/Frame<br>Obstacles:<ul><li><input id=number-of-obstacles value='
          + settings['number-of-obstacles'] + '>*2 #<li><input id=obstacle-size value='
          + settings['obstacle-size'] + '>+5&lt;Size</ul>Particles:<ul><li><input id=number-of-particles value='
          + settings['number-of-particles'] + '>#<li><input id=number-of-spawners value='
          + settings['number-of-spawners'] + '>*2 Spawners<li><input id=particle-speed value='
          + settings['particle-speed'] + '>&gt;Speed</ul><a onclick=reset()>Reset Settings</a></div></div>';
    }
}

function update_static_buffer(){
    buffer_static.clearRect(
      0,
      0,
      width,
      height
    );

    // Draw obstacles.
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

    // Draw scenery rectangles at edges of game area.
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

    // Draw spawners.
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
var key_left = false;
var key_right = false;
var mode = 0;
var obstacles = [];
var particles = [];
var particle_x_limit = 0;
var players = [];
var p0_move = 0;
var p1_move = 0;
var settings = {
  'audio-volume': window.localStorage.getItem('Particleball.htm-audio-volume') === null
    ? 1
    : parseFloat(window.localStorage.getItem('Particleball.htm-audio-volume')),
  'gamearea-height': window.localStorage.getItem('Particleball.htm-gamearea-height') === null
    ? 200
    : parseInt(window.localStorage.getItem('Particleball.htm-gamearea-height')),
  'gamearea-width': window.localStorage.getItem('Particleball.htm-gamearea-width') === null
    ? 420
    : parseInt(window.localStorage.getItem('Particleball.htm-gamearea-width')),
  'movement-keys': window.localStorage.getItem('Particleball.htm-movement-keys') === null
    ? 'AD'
    : window.localStorage.getItem('Particleball.htm-movement-keys'),
  'ms-per-frame': window.localStorage.getItem('Particleball.htm-ms-per-frame') === null
    ? 25
    : parseInt(window.localStorage.getItem('Particleball.htm-ms-per-frame')),
  'number-of-obstacles': window.localStorage.getItem('Particleball.htm-number-of-obstacles') === null
    ? 10
    : parseInt(window.localStorage.getItem('Particleball.htm-number-of-obstacles')),
  'number-of-particles': window.localStorage.getItem('Particleball.htm-number-of-particles') === null
    ? 100
    : parseInt(window.localStorage.getItem('Particleball.htm-number-of-particles')),
  'number-of-spawners': window.localStorage.getItem('Particleball.htm-number-of-spawners') === null
    ? 3
    : parseInt(window.localStorage.getItem('Particleball.htm-number-of-spawners')),
  'obstacle-size': window.localStorage.getItem('Particleball.htm-obstacle-size') === null
    ? 65
    : parseInt(window.localStorage.getItem('Particleball.htm-obstacle-size')),
  'particle-speed': window.localStorage.getItem('Particleball.htm-particle-speed') === null
    ? 1.5
    : parseFloat(window.localStorage.getItem('Particleball.htm-particle-speed')),
  'restart-key': window.localStorage.getItem('Particleball.htm-restart-key') === null
    ? 'H'
    : window.localStorage.getItem('Particleball.htm-restart-key'),
  'score-goal': window.localStorage.getItem('Particleball.htm-score-goal') === null
    ? 20
    : parseInt(window.localStorage.getItem('Particleball.htm-score-goal')),
};
var spawners = [];
var x = 0;
var width = 0;
var y = 0;

setmode(0, 1);

window.onkeydown = function(e){
    if(mode <= 0){
        return;
    }

    var key = e.keyCode || e.which;

    // ESC: return to main menu.
    if(key === 27){
        setmode(0, 1);

    }else{
        key = String.fromCharCode(key);

        if(key === settings['movement-keys'][0]){
            key_left = true;

        }else if(key === settings['movement-keys'][1]){
             key_right = true;

        }else if(key === settings['restart-key']){
            setmode(mode, 0);
        } 
    }
};

window.onkeyup = function(e){
    var key = String.fromCharCode(e.keyCode || e.which);

    if(key === settings['movement-keys'][0]){
        key_left = false;

    }else if(key === settings['movement-keys'][1]){
        key_right = false;
    }
};

window.onmousedown = function(e){
    if(mode <= 0){
        return;
    }

    // Clicks create new obstacles
    create_obstacle(
      e.pageX - x,// New obstacle center_x
      e.pageY - y// New obstacle center_y
    );

    update_static_buffer();
};

window.onresize = resize;
