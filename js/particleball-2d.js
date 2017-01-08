'use strict';

function create_obstacle(obstacle_x, obstacle_y){
    var obstacle_height = random_integer({
      'max': settings_settings['obstacle-size'],
    }) + 5;
    var obstacle_width = random_integer({
      'max': settings_settings['obstacle-size'],
    }) + 5;

    // Add new obstacle.
    obstacles.push({
      'height': obstacle_height,
      'multiplier': settings_settings['obstacle-multiplier'],
      'width': obstacle_width,
      'x': obstacle_x - obstacle_width / 2,
      'y': obstacle_y - obstacle_height / 2,
    });

    // Add mirrored verison of new obstacle.
    obstacles.push({
      'height': obstacle_height,
      'multiplier': settings_settings['obstacle-multiplier'],
      'width': obstacle_width,
      'x': -obstacle_x - obstacle_width / 2,
      'y': -obstacle_y - obstacle_height / 2,
    });
}

function draw_logic(){
    canvas_buffer.save();
    canvas_buffer.translate(
      canvas_x,
      canvas_y
    );

    // Draw obstacles.
    canvas_buffer.fillStyle = '#3c3c3c';
    for(var obstacle in obstacles){
        canvas_buffer.fillRect(
          obstacles[obstacle]['x'],
          obstacles[obstacle]['y'],
          obstacles[obstacle]['width'],
          obstacles[obstacle]['height']
        );
    }

    // Draw scenery rectangles at edges of game area.
    canvas_buffer.fillRect(
      -gamearea_width_half - 5,
      -gamearea_height_half - 205,
      5,
      gamearea_playerdist
    );
    canvas_buffer.fillRect(
      gamearea_width_half,
      -gamearea_height_half - 205,
      5,
      gamearea_playerdist
    );
    canvas_buffer.fillRect(
      -gamearea_width_half,
      -gamearea_height_half - 205,
      gamearea_width_half - 90,
      5
    );
    canvas_buffer.fillRect(
      gamearea_width_half,
      -gamearea_height_half - 205,
      90 - gamearea_width_half,
      5
    );
    canvas_buffer.fillRect(
      -gamearea_width_half,
      200 + gamearea_height_half,
      gamearea_width_half - 90,
      5
    );
    canvas_buffer.fillRect(
      gamearea_width_half,
      200 + gamearea_height_half,
      90 - gamearea_width_half,
      5
    );

    // Draw spawners.
    canvas_buffer.fillStyle = '#476291';
    for(var spawner in spawners){
        canvas_buffer.fillRect(
          spawners[spawner][0] - 4,
          spawners[spawner][1] - 4,
          8,
          8
        );
    }

    for(var particle in particles){
        // Draw particles, #ddd if they are unclaimed and #player_color if they are claimed.
        canvas_buffer.fillStyle = particles[particle]['owner'] < 0
          ? '#ddd'
          : players[particles[particle]['owner']]['color'];
        canvas_buffer.fillRect(
          Math.round(particles[particle]['x']) - 2,
          Math.round(particles[particle]['y']) - 2,
          4,
          4
        );
    }

    for(var player in players){
        // Set color to player color.
        canvas_buffer.fillStyle = players[player]['color'];

        // Draw paddle.
        canvas_buffer.fillRect(
          players[player]['paddle-x'],
          players[player]['paddle-y'],
          players[player]['paddle-width'],
          players[player]['paddle-height']
        );

        // Draw goal.
        canvas_buffer.fillRect(
          players[player]['goal-x'],
          players[player]['goal-y'],
          players[player]['goal-width'],
          players[player]['goal-height']
        );

        // Draw score.
        canvas_buffer.fillText(
          players[player]['score'] + '/' + settings_settings['score-goal'],
          players[player]['paddle-x'],
          players[player]['paddle-y'] + (player == 0 ? 60 : -35)
        );
    }

    canvas_buffer.restore();

    // Players win if they have score-goal points.
    if(players[0]['score'] >= settings_settings['score-goal']
      || players[1]['score'] >= settings_settings['score-goal']){
        canvas_buffer.fillStyle = '#fff';
        canvas_buffer.fillText(
          settings_settings['restart-key'] + ' = Restart',
          0,
          canvas_y / 2 + 25
        );
        canvas_buffer.fillText(
          'ESC = Main Menu',
          0,
          canvas_y / 2 + 50
        );

        var winner = players[0]['score'] > players[1]['score']
          ? 0
          : 1;
        canvas_buffer.fillStyle = players[winner]['color'];
        canvas_buffer.fillText(
          'Player ' + winner + ' wins!',
          0,
          canvas_y / 2
        );
    }
}

function logic(){
    if(canvas_menu){
        return;
    }

    // Move player 1 paddle, prevent from moving past goal boundaries.
    players[1]['paddle-x'] += players[1]['paddle-x-move'];
    if(players[1]['paddle-x'] > 20){
        players[1]['paddle-x'] = 20;
    }else if(players[1]['paddle-x'] < -90){
        players[1]['paddle-x'] = -90;
    }

    // If player controlled, handle keypress movement...
    if(player_controlled){
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
    if(particles.length < settings_settings['number-of-particles']){
        // Pick a random spawner.
        var random_spawner = random_integer({
          'max': spawners.length,
        });

        // Add particle.
        particles.push({
          'owner': -1,
          'x': spawners[random_spawner][0],
          'x-speed': Math.random() * (settings_settings['particle-speed'] * 2) - settings_settings['particle-speed'],
          'y': spawners[random_spawner][1],
          'y-speed': Math.random() * (settings_settings['particle-speed'] * 2) - settings_settings['particle-speed'],
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
            audio_start({
              'id': 'boop',
              'volume-multiplier': settings_settings['audio-volume'],
            });

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

        var bounced = false;

        // Loop through obstacles to find collisions.
        for(var obstacle in obstacles){
            // X collisions.
            if(particles[particle]['x'] >= obstacles[obstacle]['x']
              && particles[particle]['x'] <= obstacles[obstacle]['x'] + obstacles[obstacle]['width']){
                if(particles[particle]['y-speed'] > 0){
                    if(particles[particle]['y'] > obstacles[obstacle]['y'] - 2
                      && particles[particle]['y'] < obstacles[obstacle]['y']){
                        particles[particle]['y-speed'] *= -obstacles[obstacle]['multiplier'];
                        bounced = true;
                    }

                }else if(particles[particle]['y'] > obstacles[obstacle]['y'] + obstacles[obstacle]['height']
                  && particles[particle]['y'] < obstacles[obstacle]['y'] + obstacles[obstacle]['height'] + 2){
                    particles[particle]['y-speed'] *= -obstacles[obstacle]['multiplier'];
                    bounced = true;
                }

            // Y collisions.
            }else if(particles[particle]['y'] >= obstacles[obstacle]['y']
              && particles[particle]['y'] <= obstacles[obstacle]['y'] + obstacles[obstacle]['height']){
                if(particles[particle]['x-speed'] > 0){
                    if(particles[particle]['x'] > obstacles[obstacle]['x'] - 2
                      && particles[particle]['x'] < obstacles[obstacle]['x']){
                        particles[particle]['x-speed'] *= -obstacles[obstacle]['multiplier'];
                        bounced = true;
                    }

                }else if(particles[particle]['x'] > obstacles[obstacle]['x'] + obstacles[obstacle]['width']
                  && particles[particle]['x'] < obstacles[obstacle]['x'] + obstacles[obstacle]['width'] + 2){
                    particles[particle]['x-speed'] *= -obstacles[obstacle]['multiplier'];
                    bounced = true;
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
                        particles[particle]['x-speed'] = Math.random() * (settings_settings['particle-speed'] * 2) - settings_settings['particle-speed'];
                        particles[particle]['y-speed'] *= -1;
                        particles[particle]['owner'] = 0;
                        bounced = true;
                    }

                }else if(particles[particle]['x'] > players[1]['paddle-x']- 2
                  && particles[particle]['x'] < players[1]['paddle-x'] + players[1]['paddle-width'] + 2
                  && particles[particle]['y-speed'] < 0
                  && particles[particle]['y'] - 2 <= players[1]['paddle-y'] + players[1]['paddle-height']){
                    particles[particle]['y-speed'] *= -1;
                    particles[particle]['owner'] = 1;
                    bounced = true;
                }

            // Left/right wall collisions.
            }else if(Math.abs(particles[particle]['x']) > particle_x_limit){
                particles[particle]['x-speed'] *= -1;
                bounced = true;

            // Player paddle collisions.
            }else if((particles[particle]['y-speed'] < 0 && particles[particle]['y'] - 2 <= players[1]['paddle-y'] + players[1]['paddle-height'])
              || (particles[particle]['y-speed'] > 0 && particles[particle]['y'] + 2 >= players[0]['paddle-y'])){
                particles[particle]['y-speed'] *= -1;
                bounced = true;
            }
        }

        if(bounced){
            particles[particle]['x-speed'] *= settings_settings['particle-bounce'];
            particles[particle]['y-speed'] *= settings_settings['particle-bounce'];
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

    // If either player has score-goal points.
    if(players[0]['score'] >= settings_settings['score-goal']
      || players[1]['score'] >= settings_settings['score-goal']){
        window.clearInterval(canvas_interval);
    }
}

function setmode_logic(newgame){
    obstacles = [];
    particles = [];
    spawners = [];

    // Main menu mode.
    if(canvas_mode === 0){
        document.body.innerHTML = '<div><div><a onclick=canvas_setmode({mode:1,newgame:true})>AI vs AI</a><br>'
          + '<a onclick=canvas_setmode({mode:2,newgame:true})>Player vs AI</a></div></div>'
          + '</div><div class=right><div><input disabled value=ESC>Menu<br>'
          + '<input id=movement-keys maxlength=2>Move ←→<br>'
          + '<input disabled value=Click>Obstacles++<br>'
          + '<input id=restart-key maxlength=1>Restart</div><hr>'
          + '<div><input id=audio-volume max=1 min=0 step=0.01 type=range>Audio<br>'
          + '<input id=score-goal>Goal<br>'
          + 'Level:<ul><li><input id=gamearea-height>*2+100 Height'
          + '<li><input id=gamearea-width>*2+100 Width</ul>'
          + '<input id=ms-per-frame>ms/Frame<br>'
          + 'Obstacles:<ul><li><input id=obstacle-multiplier>Multiplier'
          + '<li><input id=number-of-obstacles>*2 #'
          + '<li><input id=obstacle-size>+5&lt;Size</ul>'
          + 'Particles:<ul><li><input id=number-of-particles>#'
          + '<li><input id=particle-bounce>Bounce'
          + '<li><input id=number-of-spawners>*2 Spawners'
          + '<li><input id=particle-speed>&gt;Speed</ul>'
          + '<a onclick=settings_reset()>Reset Settings</a></div></div>';
        settings_update();

    // New game mode.
    }else{
        player_controlled = canvas_mode === 2;

        if(newgame){
            settings_save();
        }

        // Get half of height and width of game area.
        gamearea_height_half = settings_settings['gamearea-height'] - 150;
        gamearea_width_half = settings_settings['gamearea-width'] + 100;

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
            'color': '#f70',
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
        settings_settings['number-of-spawners'] = Math.max(
          settings_settings['number-of-spawners'],
          1
        );

        var loop_counter = settings_settings['number-of-spawners'] - 1;
        do{
            // new spawner center_x
            var temp0 = random_integer({
              'max': gamearea_width_half * 2,
            }) - gamearea_width_half;
            // new spawner center_y
            var temp1 = random_integer({
              'max': (gamearea_playerdist - 25) / 4,
            });

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

        if(settings_settings['number-of-obstacles'] > 0){
            var loop_counter = settings_settings['number-of-obstacles'] - 1;
            do{
                create_obstacle(
                  random_integer({
                    'max': gamearea_width_half * 2,
                  }) - gamearea_width_half,
                  random_integer({
                    'max': (gamearea_playerdist - 25) / 2,
                  })
                );
            }while(loop_counter--);
        }
    }
}

var gamearea_height_half = 0;
var gamearea_playerdist = 0;
var gamearea_width_half = 0;
var key_left = false;
var key_right = false;
var obstacles = [];
var particles = [];
var particle_x_limit = 0;
var player_controlled = false;
var players = [];
var spawners = [];

window.onkeydown = function(e){
    if(canvas_mode <= 0){
        return;
    }

    var key = e.keyCode || e.which;

    // ESC: menu.
    if(key === 27){
        canvas_menu_toggle();
        return;
    }

    key = String.fromCharCode(key);

    if(key === settings_settings['movement-keys'][0]){
        key_left = true;

    }else if(key === settings_settings['movement-keys'][1]){
         key_right = true;

    }else if(key === settings_settings['restart-key']){
        canvas_setmode({
          'mode': canvas_mode,
        });

    }else if(key === 'Q'){
        canvas_menu_quit();
    }
};

window.onkeyup = function(e){
    var key = String.fromCharCode(e.keyCode || e.which);

    if(key === settings_settings['movement-keys'][0]){
        key_left = false;

    }else if(key === settings_settings['movement-keys'][1]){
        key_right = false;
    }
};

window.onload = function(e){
    settings_init({
      'prefix': 'Particleball-2D.htm-',
      'settings': {
        'audio-volume': 1,
        'gamearea-height': 200,
        'gamearea-width': 420,
        'movement-keys': 'AD',
        'ms-per-frame': 25,
        'number-of-obstacles': 10,
        'number-of-particles': 100,
        'number-of-spawners': 3,
        'obstacle-multiplier': 1.01,
        'obstacle-size': 65,
        'particle-bounce': 1,
        'particle-speed': 1.5,
        'restart-key': 'H',
        'score-goal': 20,
      },
    });
    audio_init();
    audio_create({
      'id': 'boop',
      'properties': {
        'duration': .1,
        'volume': .1,
      },
    });
    canvas_init();
};

window.onmousedown = function(e){
    if(canvas_mode <= 0){
        return;
    }

    var pageX = e.pageX - canvas_x;
    var pageY = e.pageY - canvas_y;

    // Check if clicked on obstacle.
    for(var obstacle in obstacles){
        if(pageX >= obstacles[obstacle]['x']
          && pageX <= obstacles[obstacle]['x'] + obstacles[obstacle]['width']
          && pageY >= obstacles[obstacle]['y']
          && pageY <= obstacles[obstacle]['y'] + obstacles[obstacle]['height']){
            // Delete the obstacle.
            obstacles.splice(
              obstacle % 2
                ? obstacle - 1
                : obstacle,
              2
            );

            return;
        }
    }

    // Clicks create new obstacles.
    create_obstacle(
      pageX,
      pageY
    );
};
