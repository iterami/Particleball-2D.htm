'use strict';

function draw_logic(){
    canvas_buffer.save();
    canvas_buffer.translate(
      canvas_x,
      canvas_y
    );

    // Draw gamearea background.
    canvas_buffer.fillStyle = '#000';
    canvas_buffer.fillRect(
      -core_storage_data['gamearea-width'] / 2,
      -core_storage_data['gamearea-height'] / 2,
      core_storage_data['gamearea-width'],
      core_storage_data['gamearea-height']
    );
    canvas_buffer.fillRect(
      -90,
      -players[0]['goal-y'],
      180,
      gamearea_playerdist + 20
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

    // Draw particles.
    for(var particle in particles){
        canvas_buffer.fillStyle = particles[particle]['owner'] < 0
          ? core_storage_data['particle-color']
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
        canvas_buffer.fillStyle = '#fff';
        canvas_buffer.fillText(
          players[player]['score'] + '/' + core_storage_data['score-goal'],
          players[player]['paddle-x'],
          players[player]['paddle-y'] + (player == 0 ? 60 : -35)
        );
    }

    canvas_buffer.restore();

    // Players win if they have score-goal points.
    if(players[0]['score'] >= core_storage_data['score-goal']
      || players[1]['score'] >= core_storage_data['score-goal']){
        canvas_buffer.fillStyle = '#fff';
        canvas_buffer.fillText(
          'H = Restart',
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
    // Move player 1 paddle, prevent from moving past goal boundaries.
    players[1]['paddle-x'] += players[1]['paddle-x-move'];
    if(players[1]['paddle-x'] > 20){
        players[1]['paddle-x'] = 20;
    }else if(players[1]['paddle-x'] < -90){
        players[1]['paddle-x'] = -90;
    }

    // If player controlled, handle keypress movement...
    if(player_controlled){
        if(core_keys[65]['state']
          && players[0]['paddle-x'] > -90){
            players[0]['paddle-x'] -= 2;
        }else if(players[0]['paddle-x'] < -90){
            players[0]['paddle-x'] = -90;
        }
        if(core_keys[68]['state']
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
    if(particles.length < core_storage_data['number-of-particles']){
        // Pick a random spawner.
        var random_spawner = core_random_integer({
          'max': spawners.length,
        });

        // Add particle.
        particles.push({
          'owner': -1,
          'x': spawners[random_spawner][0],
          'x-speed': Math.random() * (core_storage_data['particle-speed'] * 2) - core_storage_data['particle-speed'],
          'y': spawners[random_spawner][1],
          'y-speed': Math.random() * (core_storage_data['particle-speed'] * 2) - core_storage_data['particle-speed'],
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
            core_audio_start({
              'id': 'boop',
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

        var bounce_x = 1;
        var bounce_y = 1;

        // Loop through obstacles to find collisions.
        for(var obstacle in obstacles){
            // X collisions.
            if(particles[particle]['x'] >= obstacles[obstacle]['x']
              && particles[particle]['x'] <= obstacles[obstacle]['x'] + obstacles[obstacle]['width']){
                if(particles[particle]['y-speed'] > 0){
                    if(particles[particle]['y'] > obstacles[obstacle]['y'] - 2
                      && particles[particle]['y'] < obstacles[obstacle]['y']){
                        bounce_y = -core_storage_data['obstacle-multiplier'];
                    }

                }else if(particles[particle]['y'] > obstacles[obstacle]['y'] + obstacles[obstacle]['height']
                  && particles[particle]['y'] < obstacles[obstacle]['y'] + obstacles[obstacle]['height'] + 2){
                    bounce_y = -core_storage_data['obstacle-multiplier'];
                }

            // Y collisions.
            }else if(particles[particle]['y'] >= obstacles[obstacle]['y']
              && particles[particle]['y'] <= obstacles[obstacle]['y'] + obstacles[obstacle]['height']){
                if(particles[particle]['x-speed'] > 0){
                    if(particles[particle]['x'] > obstacles[obstacle]['x'] - 2
                      && particles[particle]['x'] < obstacles[obstacle]['x']){
                        bounce_x = -core_storage_data['obstacle-multiplier'];
                    }

                }else if(particles[particle]['x'] > obstacles[obstacle]['x'] + obstacles[obstacle]['width']
                  && particles[particle]['x'] < obstacles[obstacle]['x'] + obstacles[obstacle]['width'] + 2){
                    bounce_x = -core_storage_data['obstacle-multiplier'];
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
                        particles[particle]['x-speed'] = Math.random() * (core_storage_data['particle-speed'] * 2) - core_storage_data['particle-speed'];
                        particles[particle]['owner'] = 0;
                        bounce_y = -1;
                    }

                }else if(particles[particle]['x'] > players[1]['paddle-x']- 2
                  && particles[particle]['x'] < players[1]['paddle-x'] + players[1]['paddle-width'] + 2
                  && particles[particle]['y-speed'] < 0
                  && particles[particle]['y'] - 2 <= players[1]['paddle-y'] + players[1]['paddle-height']){
                    particles[particle]['owner'] = 1;
                    bounce_y = -1;
                }

            // Left/right wall collisions.
            }else if(Math.abs(particles[particle]['x']) > particle_x_limit){
                bounce_x = -1;

            // Player paddle collisions.
            }else if((particles[particle]['y-speed'] < 0 && particles[particle]['y'] - 2 <= players[1]['paddle-y'] + players[1]['paddle-height'])
              || (particles[particle]['y-speed'] > 0 && particles[particle]['y'] + 2 >= players[0]['paddle-y'])){
                bounce_y = -1;
            }
        }

        // Move particles.
        particles[particle]['x-speed'] *= bounce_x;
        particles[particle]['y-speed'] *= bounce_y;
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

    // End game if any player has >= score-goal score.
    for(var player in players){
        if(players[player]['score'] >= core_storage_data['score-goal']){
            window.clearInterval(canvas_interval);
        }
    }
}

function repo_init(){
    core_repo_init({
      'audios': {
        'boop': {
          'duration': .1,
        },
      },
      'info': '<input onclick=canvas_setmode({newgame:true}) type=button value="AI vs AI"><input onclick=canvas_setmode({mode:1,newgame:true}) type=button value="Player vs AI">',
      'keybinds': {
        65: {},
        68: {},
        72: {
          'todo': function(){
            canvas_setmode({
              'mode': core_mode,
            });
          },
        },
      },
      'menu': true,
      'mousebinds': {
        'mousedown': {
          'todo': function(){
              var pageX = core_mouse['x'] - canvas_x;
              var pageY = core_mouse['y'] - canvas_y;

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
          },
        },
      },
      'storage': {
        'gamearea-height': 500,
        'gamearea-width': 1000,
        'number-of-obstacles': 10,
        'number-of-particles': 100,
        'number-of-spawners': 3,
        'obstacle-multiplier': 1.01,
        'obstacle-size': 65,
        'particle-color': '#dddddd',
        'particle-bounce': 1,
        'particle-speed': 1.5,
        'score-goal': 20,
      },
      'storage-menu': '<table><tr><td><input id=score-goal><td>Goal<tr><td><input id=gamearea-height><td>Level Height<tr><td><input id=gamearea-width><td>Width<tr><td><input id=obstacle-multiplier><td>Obstacle Multiplier<tr><td><input id=number-of-obstacles><td>*2 # of Obstacles<tr><td><input id=obstacle-size><td>+5 &lt; Obstacle Size<tr><td><input id=number-of-particles><td># of Particles<tr><td><input id=particle-bounce><td>Particle Bounce<tr><td><input id=particle-color type=color><td>Particle Color<tr><td><input id=particle-speed><td>&gt; Particle Speed<tr><td><input id=number-of-spawners><td>*2 Spawners</table>',
      'title': 'Particleball-2D.htm',
    });
    canvas_init();
}

var gamearea_playerdist = 0;
var obstacles = [];
var particles = [];
var particle_x_limit = 0;
var player_controlled = false;
var players = [];
var spawners = [];
