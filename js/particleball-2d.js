function create_obstacle(obstacle_x, obstacle_y){
    var obstacle_height = Math.floor(Math.random() * settings['obstacle-size']) + 5;// new obstacle height
    var obstacle_width = Math.floor(Math.random() * settings['obstacle-size']) + 5;// new obstacle width

    // Add new obstacle.
    obstacles.push({
      'height': obstacle_height,
      'width': obstacle_width,
      'x': obstacle_x - obstacle_width / 2,
      'y': obstacle_y - obstacle_height / 2,
    });

    // Add mirrored verison of new obstacle.
    obstacles.push({
      'height': obstacle_height,
      'width': obstacle_width,
      'x': -obstacle_x - obstacle_width / 2,
      'y': -obstacle_y - obstacle_height / 2,
    });
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

    for(var particle in particles){
        // Draw particles, #ddd if they are unclaimed and #player_color if they are claimed.
        buffer.fillStyle = particles[particle]['owner'] < 0
          ? '#ddd'
          : players[particles[particle]['owner']]['color'];
        buffer.fillRect(
          Math.round(particles[particle]['x']) + x - 2,
          Math.round(particles[particle]['y']) + y - 2,
          4,
          4
        );
    }

    // Setup text display.
    buffer.font = '23pt sans-serif';
    buffer.textAlign = 'center';

    for(var player in players){
        // Set color to player color.
        buffer.fillStyle = players[player]['color'];

        // Draw paddle.
        buffer.fillRect(
          players[player]['paddle-x'] + x,
          players[player]['paddle-y'] + y,
          players[player]['paddle-width'],
          players[player]['paddle-height']
        );

        // Draw goal.
        buffer.fillRect(
          players[player]['goal-x'] + x,
          players[player]['goal-y'] + y,
          players[player]['goal-width'],
          players[player]['goal-height']
        );

        // Draw score.
        buffer.fillText(
          'Score: ' + players[player]['score'] + '/' + settings['score-goal'],
          players[player]['paddle-x'] + x + players[player]['paddle-width'] / 2,
          players[player]['paddle-y'] + y + (player == 0 ? 60 : -35)
        );
    }

    // Players win if they have score-goal points.
    if(players[0]['score'] >= settings['score-goal']
      || players[1]['score'] >= settings['score-goal']){
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

        if(players[0]['score'] > players[1]['score']){
            buffer.fillStyle = players[0]['color'];
            buffer.fillText(
              ai_or_player
                ? 'You win! ☺'
                : 'Player 0 wins!',
              x,
              y / 2
            );

        }else{
            buffer.fillStyle = players[1]['color'];
            buffer.fillText(
              ai_or_player
                ? 'You lose. ☹'
                : 'Player 1 wins!',
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

    animationFrame = window.requestAnimationFrame(draw);
}

function logic(){
    // Move player 1 paddle, prevent from moving past goal boundaries.
    players[1]['paddle-x'] += players[1]['paddle-x-move'];
    if(players[1]['paddle-x'] > 20){
        players[1]['paddle-x'] = 20;
    }else if(players[1]['paddle-x'] < -90){
        players[1]['paddle-x'] = -90;
    }

    // If player controlled, handle keypress movement...
    if(ai_or_player){
        if(key_left
          && players[0]['paddle-x'] > -90){
            players[0]['paddle-x'] -= 2;
        }else if(players[0]['paddle-x'] < -90){
            players[0]['paddle-x'] = -90;
        }
        if(key_right
          && players[0]['paddle-x'] < 20){
            players[0]['paddle-x'] += 2;
        }else if(players[0]['paddle-x'] > 20){
            players[0]['paddle-x'] = 20;
        }

    // ...else move via AI.
    }else{
        players[0]['paddle-x'] += players[0]['paddle-x-move'];
        if(players[0]['paddle-x'] > 20){
            players[0]['paddle-x'] = 20;
        }else if(players[0]['paddle-x'] < -90){
            players[0]['paddle-x'] = -90;
        }
    }

    // If the current number of particles
    //   is less than max, add new particle.
    if(particles.length < settings['number-of-particles']){
        // Pick a random spawner.
        var random_spawner = Math.floor(Math.random() * spawners.length);

        // Add particle.
        particles.push({
          'owner': -1,
          'x': spawners[random_spawner][0],
          'x-speed': Math.random() * (settings['particle-speed'] * 2) - settings['particle-speed'],
          'y': spawners[random_spawner][1],
          'y-speed': Math.random() * (settings['particle-speed'] * 2) - settings['particle-speed'],
        });
    }

    // Reset movements for recalculation.
    players[0]['paddle-x-move'] = -1;
    players[1]['paddle-x-move'] = -1;

    for(var particle in particles){
        // If particle is with 90 pixels of center of goal.
        if(Math.abs(particles[particle]['x']) < 90){
            // If particle is moving downwards...
            if(particles[particle]['y-speed'] > 0){
                // Link player 0 AI to track this particle if it is closest.
                if((players[0]['paddle-x-move'] === -1 || particles[particle]['y'] > particles[players[0]['paddle-x-move']]['y'])
                  && particles[particle]['y'] < players[0]['paddle-y']){
                    players[0]['paddle-x-move'] = particle;
                }

            // ...else link player 1 AI to track this particle if it is closest.
            }else if((players[1]['paddle-x-move'] === -1 || particles[particle]['y'] < particles[players[1]['paddle-x-move']]['y'])
              && particles[particle]['y'] > players[1]['paddle-y']){
                players[1]['paddle-x-move'] = particle;
            }
        }

        // If particle has collided with a goal.
        if(particles[particle]['y'] + 2 > players[0]['goal-y']
          || particles[particle]['y'] - 2 < players[1]['goal-y'] + players[1]['goal-height']){
            // Determine which player scored a goal.
            var temp_player = 0;
            if(particles[particle]['y'] + 2 > players[0]['goal-y']){
                temp_player = 1;
            }

            // Decrease the other players score by 1 if it is greater than 0.
            if(players[1 - temp_player]['score'] > 0){
                players[1 - temp_player]['score'] -= 1;
            }

            // Increase the scoring players score by 1.
            if(particles[particle]['owner'] === temp_player){
                players[temp_player]['score'] += 1;
            }

            // Delete the particle.
            particles.splice(
              particle,
              1
            );

            players[0]['paddle-x-move'] = 0;
            players[1]['paddle-x-move'] = 0;

            continue;
        }

        // Loop through obstacles to find collisions.
        for(var obstacle in obstacles){
            // X collisions.
            if(particles[particle]['x'] >= obstacles[obstacle]['x']
              && particles[particle]['x'] <= obstacles[obstacle]['x'] + obstacles[obstacle]['width']){
                if(particles[particle]['y-speed'] > 0){
                    if(particles[particle]['y'] > obstacles[obstacle]['y'] - 2
                      && particles[particle]['y'] < obstacles[obstacle]['y']){
                        particles[particle]['y-speed'] *= -1;
                    }

                }else if(particles[particle]['y'] > obstacles[obstacle]['y'] + obstacles[obstacle]['height']
                  && particles[particle]['y'] < obstacles[obstacle]['y'] + obstacles[obstacle]['height'] + 2){
                    particles[particle]['y-speed'] *= -1;
                }

            // Y collisions.
            }else if(particles[particle]['y'] >= obstacles[obstacle]['y']
              && particles[particle]['y'] <= obstacles[obstacle]['y'] + obstacles[obstacle]['height']){
                if(particles[particle]['x-speed'] > 0){
                    if(particles[particle]['x'] > obstacles[obstacle]['x'] - 2
                      && particles[particle]['x'] < obstacles[obstacle]['x']){
                        particles[particle]['x-speed'] *= -1;
                    }

                }else if(particles[particle]['x'] > obstacles[obstacle]['x'] + obstacles[obstacle]['width']
                  && particles[particle]['x'] < obstacles[obstacle]['x'] + obstacles[obstacle]['width'] + 2){
                    particles[particle]['x-speed'] *= -1;
                }
            }
        }

        // Check for collisions with player paddles or edges of game area.
        if(particles[particle]['y'] > players[1]['paddle-y'] + players[1]['paddle-height']
          && particles[particle]['y'] < players[0]['paddle-y']){
            if(Math.abs(particles[particle]['x']) < 88){
                if(particles[particle]['y'] > 0){
                    if(particles[particle]['x'] > players[0]['paddle-x'] - 2
                      && particles[particle]['x'] < players[0]['paddle-x'] + players[0]['paddle-width'] + 2
                      && particles[particle]['y-speed'] > 0
                      && particles[particle]['y'] + 2 >= players[0]['paddle-y']){
                        particles[particle]['x-speed'] = Math.random() * (settings['particle-speed'] * 2) - settings['particle-speed'];
                        particles[particle]['y-speed'] *= -1;
                        particles[particle]['owner'] = 0;
                    }

                }else if(particles[particle]['x'] > players[1]['paddle-x']- 2
                  && particles[particle]['x'] < players[1]['paddle-x'] + players[1]['paddle-width'] + 2
                  && particles[particle]['y-speed'] < 0
                  && particles[particle]['y'] - 2 <= players[1]['paddle-y'] + players[1]['paddle-height']){
                    particles[particle]['y-speed'] *= -1;
                    particles[particle]['owner'] = 1;
                }

            // Left/right wall collisions.
            }else if(Math.abs(particles[particle]['x']) > particle_x_limit){
                particles[particle]['x-speed'] *= -1;

            // Player paddle collisions.
            }else if((particles[particle]['y-speed'] < 0 && particles[particle]['y'] - 2 <= players[1]['paddle-y'] + players[1]['paddle-height'])
              || (particles[particle]['y-speed'] > 0 && particles[particle]['y'] + 2 >= players[0]['paddle-y'])){
                particles[particle]['y-speed'] *= -1;
            }
        }

        // Move particles.
        particles[particle]['x'] += particles[particle]['x-speed'];
        particles[particle]['y'] += particles[particle]['y-speed'];
    }

    // Calculate movement direction for next frame if player0 ai is tracking a particle.
    var paddle_position = players[0]['paddle-x'] + players[0]['paddle-width'] / 2;
    if(players[0]['paddle-x-move'] === -1){
        if(paddle_position === 0){
            players[0]['paddle-x-move'] = 0;

        }else{
            players[0]['paddle-x-move'] = paddle_position < 0
              ? 2
              : -2;
        }

    }else{
        players[0]['paddle-x-move'] = particles[players[0]['paddle-x-move']]['x'] > paddle_position
          ? 2
          : -2;
    }

    // Calculate movement direction for next frame if player1 ai is tracking a particle.
    paddle_position = players[1]['paddle-x'] + players[1]['paddle-width'] / 2;
    if(players[1]['paddle-x-move'] === -1){
        if(paddle_position === 0){
            players[1]['paddle-x-move'] = 0;

        }else{
            players[1]['paddle-x-move'] = paddle_position < 0
              ? 2
              : -2;
        }

    }else{
        players[1]['paddle-x-move'] = particles[players[1]['paddle-x-move']]['x'] > paddle_position
          ? 2
          : -2;
    }

    // If either player has score-goal points and 2 more points than the other player.
    if(players[0]['score'] >= settings['score-goal']
      || players[1]['score'] >= settings['score-goal']){
        window.clearInterval(interval);
    }
}

function play_audio(id){
    if(settings['audio-volume'] <= 0){
        return;
    }

    document.getElementById(id).currentTime = 0;
    document.getElementById(id).play();
}

function reset(){
    if(!window.confirm('Reset settings?')){
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

// Save settings into window.localStorage if they differ from default.
function save(){
    var ids = {
      'audio-volume': 1,
      'gamearea-height': 200,
      'gamearea-width': 420,
      'ms-per-frame': 25,
      'number-of-obstacles': 10,
      'number-of-spawners': 3,
      'number-of-particles': 100,
      'obstacle-size': 65,
      'particle-speed': 1.5,
      'score-goal': 20,
    };
    for(var id in ids){
        if(isNaN(document.getElementById(id).value)
          || document.getElementById(id).value == ids[id]){
            window.localStorage.removeItem('Particleball-2D.htm-' + id);
            settings[id] = ids[id];

        }else{
            settings[id] = parseFloat(document.getElementById(id).value);
            window.localStorage.setItem(
              'Particleball-2D.htm-' + id,
              settings[id]
            );
        }
    }

    ids = {
      'movement-keys': 'AD',
      'restart-key': 'H',
    };
    for(id in ids){
        if(document.getElementById(id).value === ids[id]){
            window.localStorage.removeItem('Particleball-2D.htm-' + id);
            settings[id] = ids[id];

        }else{
            settings[id] = document.getElementById(id).value;
            window.localStorage.setItem(
              'Particleball-2D.htm-' + id,
              settings[id]
            );
        }
    }
}

function setmode(newmode, newgame){
    window.cancelAnimationFrame(animationFrame);
    window.clearInterval(interval);

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
            save();
        }

        // Reset keypresses.
        key_left = false;
        key_right = false;

        // Get half of height and width of game area.
        gamearea_height_half = settings['gamearea-height'] - 150;
        gamearea_width_half = settings['gamearea-width'] + 100;

        // Particle_x_limit is how far particles can go on x axis positive or negative.
        particle_x_limit = gamearea_width_half;

        // Setup player information.
        players = [
            {
              'color': '#2d8930',
              'goal-height': 20,
              'goal-width': 200,
              'goal-x': -100,
              'goal-y': 210 + gamearea_height_half,
              'paddle-height': 5,
              'paddle-width': 70,
              'paddle-x': -35,
              'paddle-x-move': 0,
              'paddle-y': 200 + gamearea_height_half,
              'score': 0,
            },
            {
              'color': '#c83232',
              'goal-height': 20,
              'goal-width': 200,
              'goal-x': -100,
              'goal-y': -230 - gamearea_height_half,
              'paddle-height': 5,
              'paddle-width': 70,
              'paddle-x': -35,
              'paddle-x-move': 0,
              'paddle-y': -205 - gamearea_height_half,
              'score': 0,
            },
        ];

        // Calculate distance between both players.
        gamearea_playerdist = Math.abs(players[1]['paddle-y']) + players[0]['paddle-y'] + 5;

        // Require spawners.
        settings['number-of-spawners'] = Math.max(
          settings['number-of-spawners'],
          1
        );

        var loop_counter = settings['number-of-spawners'] - 1;
        do{
            var temp0 = Math.floor(Math.random() * (gamearea_width_half * 2)) - gamearea_width_half;// new spawner center_x
            var temp1 = Math.floor(Math.random() * ((gamearea_playerdist - 25) / 4));// new spawner center_y

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

        if(settings['number-of-obstacles'] > 0){
            var loop_counter = settings['number-of-obstacles'] - 1;
            do{
                create_obstacle(
                  Math.floor(Math.random() * (gamearea_width_half * 2)) - gamearea_width_half,// center_x
                  Math.floor(Math.random() * ((gamearea_playerdist - 25) / 2))// center_y
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

        animationFrame = window.requestAnimationFrame(draw);
        interval = window.setInterval(
          'logic()',
          settings['ms-per-frame']
        );

        return;
    }

    // Main menu mode.
    buffer = 0;
    buffer_static = 0;
    canvas = 0;

    document.getElementById('page').innerHTML = '<div style=display:inline-block;text-align:left;vertical-align:top><div class=c><a onclick="setmode(1, true)">AI vs AI</a><br><a onclick="setmode(2, true)">Player vs AI</a></div></div></div><div style="border-left:8px solid #222;display:inline-block;text-align:left"><div class=c><input disabled style=border:0 value=ESC>Main Menu<br><input id=movement-keys maxlength=2 value='
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

function update_static_buffer(){
    buffer_static.clearRect(
      0,
      0,
      width,
      height
    );

    // Draw obstacles.
    buffer_static.fillStyle = '#3c3c3c';
    for(var obstacle in obstacles){
        buffer_static.fillRect(
          obstacles[obstacle]['x'] + x,
          obstacles[obstacle]['y'] + y,
          obstacles[obstacle]['width'],
          obstacles[obstacle]['height']
        );
    }

    // Draw scenery rectangles at edges of game area.
    buffer_static.fillRect(
      x - gamearea_width_half - 5,
      y - 205 - gamearea_height_half,
      5,
      gamearea_playerdist
    );
    buffer_static.fillRect(
      x + gamearea_width_half,
      y - 205 - gamearea_height_half,
      5,
      gamearea_playerdist
    );
    buffer_static.fillRect(
      x - gamearea_width_half,
      y - 205 - gamearea_height_half,
      gamearea_width_half - 90,
      5
    );
    buffer_static.fillRect(
      x + gamearea_width_half,
      y - 205 - gamearea_height_half,
      90 - gamearea_width_half,
      5
    );
    buffer_static.fillRect(
      x - gamearea_width_half,
      y + 200 + gamearea_height_half,
      gamearea_width_half - 90,
      5
    );
    buffer_static.fillRect(
      x + gamearea_width_half,
      y + 200 + gamearea_height_half,
      90 - gamearea_width_half,
      5
    );

    // Draw spawners.
    buffer_static.fillStyle = '#476291';
    for(var spawner in spawners){
        buffer_static.fillRect(
          spawners[spawner][0] + x - 4,
          spawners[spawner][1] + y - 4,
          8,
          8
        );
    }
}

var animationFrame = 0;
var buffer = 0;
var buffer_static = 0;
var canvas = 0;
var gamearea_height_half = 0;
var gamearea_width_half = 0;
var gamearea_playerdist = 0;
var height = 0;
var interval = 0;
var key_left = false;
var key_right = false;
var mode = 0;
var obstacles = [];
var particles = [];
var particle_x_limit = 0;
var players = [];
var settings = {
  'audio-volume': window.localStorage.getItem('Particleball-2D.htm-audio-volume') != null
    ? parseFloat(window.localStorage.getItem('Particleball-2D.htm-audio-volume'))
    : 1,
  'gamearea-height': parseInt(window.localStorage.getItem('Particleball-2D.htm-gamearea-height')) || 200,
  'gamearea-width': parseInt(window.localStorage.getItem('Particleball-2D.htm-gamearea-width')) || 420,
  'movement-keys': window.localStorage.getItem('Particleball-2D.htm-movement-keys') || 'AD',
  'ms-per-frame': parseInt(window.localStorage.getItem('Particleball-2D.htm-ms-per-frame')) || 25,
  'number-of-obstacles': window.localStorage.getItem('Particleball-2D.htm-number-of-obstacles') != null
    ? parseInt(window.localStorage.getItem('Particleball-2D.htm-number-of-obstacles'))
    : 10,
  'number-of-particles': parseInt(window.localStorage.getItem('Particleball-2D.htm-number-of-particles')) || 100,
  'number-of-spawners': parseInt(window.localStorage.getItem('Particleball-2D.htm-number-of-spawners')) || 3,
  'obstacle-size': parseInt(window.localStorage.getItem('Particleball-2D.htm-obstacle-size')) || 65,
  'particle-speed': parseFloat(window.localStorage.getItem('Particleball-2D.htm-particle-speed')) || 1.5,
  'restart-key': window.localStorage.getItem('Particleball-2D.htm-restart-key') || 'H',
  'score-goal': parseInt(window.localStorage.getItem('Particleball-2D.htm-score-goal')) || 20,
};
var spawners = [];
var x = 0;
var width = 0;
var y = 0;

window.onkeydown = function(e){
    if(mode <= 0){
        return;
    }

    var key = e.keyCode || e.which;

    // ESC: return to main menu.
    if(key === 27){
        setmode(
          0,
          true
        );
        return;
    }

    key = String.fromCharCode(key);

    if(key === settings['movement-keys'][0]){
        key_left = true;

    }else if(key === settings['movement-keys'][1]){
         key_right = true;

    }else if(key === settings['restart-key']){
        setmode(
          mode,
          false
        );
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

window.onload = function(e){
    setmode(
      0,
      true
    );
};

window.onmousedown = function(e){
    if(mode <= 0){
        return;
    }

    var pageX = e.pageX - x;
    var pageY = e.pageY - y;

    // Check if clicked on obstacle.
    var onobstacle = false;
    for(var obstacle in obstacles){
        if(pageX >= obstacles[obstacle]['x']
          && pageX <= obstacles[obstacle]['x'] + obstacles[obstacle]['width']
          && pageY >= obstacles[obstacle]['y']
          && pageY <= obstacles[obstacle]['y'] + obstacles[obstacle]['height']){
            onobstacle = true;

            // Delete the obstacle.
            obstacles.splice(
              obstacle % 2
                ? obstacle - 1
                : obstacle,
              2
            );

            break;
        }
    }

    if(!onobstacle){
        // Clicks create new obstacles.
        create_obstacle(
          pageX,// New obstacle center_x
          pageY// New obstacle center_y
        );
    }

    update_static_buffer();
};

window.onresize = resize;
