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
      -core_entities['player-0']['goal-y'],
      180,
      gamearea_playerdist + 20
    );

    // Draw obstacles.
    canvas_buffer.fillStyle = '#3c3c3c';
    core_group_modify({
      'groups': [
        'obstacle',
      ],
      'todo': function(entity){
          canvas_buffer.fillRect(
            core_entities[entity]['x'],
            core_entities[entity]['y'],
            core_entities[entity]['width'],
            core_entities[entity]['height']
          );
      },
    });

    // Draw spawners.
    canvas_buffer.fillStyle = '#476291';
    core_group_modify({
      'groups': [
        'spawner',
      ],
      'todo': function(entity){
          canvas_buffer.fillRect(
            core_entities[entity]['x'] - 4,
            core_entities[entity]['y'] - 4,
            8,
            8
          );
      },
    });

    // Draw particles.
    core_group_modify({
      'groups': [
        'particle',
      ],
      'todo': function(entity){
        canvas_buffer.fillStyle = core_entities[entity]['owner'] === false
          ? core_storage_data['particle-color']
          : core_entities[core_entities[entity]['owner']]['color'];
        canvas_buffer.fillRect(
          Math.round(core_entities[entity]['x']) - 2,
          Math.round(core_entities[entity]['y']) - 2,
          4,
          4
        );
      },
    });

    core_group_modify({
      'groups': [
        'player',
      ],
      'todo': function(entity){
          // Set color to player color.
          canvas_buffer.fillStyle = core_entities[entity]['color'];

          // Draw paddle.
          canvas_buffer.fillRect(
            core_entities[entity]['paddle-x'],
            core_entities[entity]['paddle-y'],
            core_entities[entity]['paddle-width'],
            core_entities[entity]['paddle-height']
          );

          // Draw goal.
          canvas_buffer.fillRect(
            core_entities[entity]['goal-x'],
            core_entities[entity]['goal-y'],
            core_entities[entity]['goal-width'],
            core_entities[entity]['goal-height']
          );

          // Draw score.
          canvas_buffer.fillStyle = '#fff';
          canvas_buffer.fillText(
            core_entities[entity]['score'] + '/' + core_storage_data['score-goal'],
            core_entities[entity]['paddle-x'],
            core_entities[entity]['paddle-y'] + (entity === 'player-0' ? 60 : -35)
          );
      },
    });

    canvas_buffer.restore();

    // Players win if they have score-goal points.
    if(core_entities['player-0']['score'] >= core_storage_data['score-goal']
      || core_entities['player-1']['score'] >= core_storage_data['score-goal']){
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

        var winner = core_entities['player-0']['score'] > core_entities['player-1']['score']
          ? 0
          : 1;
        canvas_buffer.fillStyle = core_entities[winner]['color'];
        canvas_buffer.fillText(
          'Player ' + winner + ' wins!',
          0,
          canvas_y / 2
        );
    }
}

function logic(){
    // If the current number of particles
    //   is less than max, add new particle.
    if(core_entity_info['particle']['count'] < core_storage_data['number-of-particles']){
        // Pick a random spawner.
        var random_spawner = core_random_key({
          'object': core_groups['spawner'],
        });

        // Add particle.
        core_entity_create({
          'properties': {
            'x': core_entities[random_spawner]['x'],
            'x-speed': Math.random() * (core_storage_data['particle-speed'] * 2) - core_storage_data['particle-speed'],
            'y': core_entities[random_spawner]['y'],
            'y-speed': Math.random() * (core_storage_data['particle-speed'] * 2) - core_storage_data['particle-speed'],
          },
          'types': [
            'particle',
          ],
        });
    }

    // Reset movements for recalculation.
    core_entities['player-0']['target'] = false;
    core_entities['player-1']['target'] = false;

    core_group_modify({
      'groups': [
        'particle',
      ],
      'todo': function(entity){
          // If particle is with 90 pixels of center of goal.
          if(Math.abs(core_entities[entity]['x']) < 90){
              // If particle is moving downwards...
              if(core_entities[entity]['y-speed'] > 0){
                  // Link player 0 AI to track this particle if it is closest.
                  if((core_entities['player-0']['target'] === false || core_entities[entity]['y'] > core_entities[core_entities['player-0']['target']]['y'])
                    && core_entities[entity]['y'] < core_entities['player-0']['paddle-y']){
                      core_entities['player-0']['target'] = entity;
                  }

              // ...else link player 1 AI to track this particle if it is closest.
              }else if((core_entities['player-1']['target'] === false || core_entities[entity]['y'] < core_entities[core_entities['player-1']['target']]['y'])
                && core_entities[entity]['y'] > core_entities['player-1']['paddle-y']){
                  core_entities['player-1']['target'] = entity;
              }
          }

          // If particle has collided with a goal.
          if(core_entities[entity]['y'] + 2 > core_entities['player-0']['goal-y']
            || core_entities[entity]['y'] - 2 < core_entities['player-1']['goal-y'] + core_entities['player-1']['goal-height']){
              core_audio_start({
                'id': 'boop',
              });

              // Determine which player scored a goal.
              var temp_player = 0;
              if(core_entities[entity]['y'] + 2 > core_entities['player-0']['goal-y']){
                  temp_player = 1;
              }

              // Decrease the other players score by 1 if it is greater than 0.
              if(core_entities['player-' + (1 - temp_player)]['score'] > 0){
                  core_entities['player-' + (1 - temp_player)]['score'] -= 1;
              }

              // Increase the scoring players score by 1.
              if(core_entities[entity]['owner'] === 'player-' + temp_player){
                  core_entities['player-' + temp_player]['score'] += 1;
              }

              if(core_entities['player-0']['target'] === entity){
                  core_entities['player-0']['target'] = false;
              }
              if(core_entities['player-1']['target'] === entity){
                  core_entities['player-1']['target'] = false;
              }

              core_entity_remove({
                'entities': [
                  entity,
                ],
              });

          }else{
              var bounce_x = 1;
              var bounce_y = 1;

              // Loop through obstacles to find collisions.
              core_group_modify({
                'groups': [
                  'obstacle',
                ],
                'todo': function(obstacle){
                    // X collisions.
                    if(core_entities[entity]['x'] >= core_entities[obstacle]['x']
                      && core_entities[entity]['x'] <= core_entities[obstacle]['x'] + core_entities[obstacle]['width']){
                        if(core_entities[entity]['y-speed'] > 0){
                            if(core_entities[entity]['y'] > core_entities[obstacle]['y'] - 2
                              && core_entities[entity]['y'] < core_entities[obstacle]['y']){
                                bounce_y = -core_storage_data['obstacle-multiplier'];
                            }

                        }else if(core_entities[entity]['y'] > core_entities[obstacle]['y'] + core_entities[obstacle]['height']
                          && core_entities[entity]['y'] < core_entities[obstacle]['y'] + core_entities[obstacle]['height'] + 2){
                            bounce_y = -core_storage_data['obstacle-multiplier'];
                        }

                    // Y collisions.
                    }else if(core_entities[entity]['y'] >= core_entities[obstacle]['y']
                      && core_entities[entity]['y'] <= core_entities[obstacle]['y'] + core_entities[obstacle]['height']){
                        if(core_entities[entity]['x-speed'] > 0){
                            if(core_entities[entity]['x'] > core_entities[obstacle]['x'] - 2
                              && core_entities[entity]['x'] < core_entities[obstacle]['x']){
                                bounce_x = -core_storage_data['obstacle-multiplier'];
                            }

                        }else if(core_entities[entity]['x'] > core_entities[obstacle]['x'] + core_entities[obstacle]['width']
                          && core_entities[entity]['x'] < core_entities[obstacle]['x'] + core_entities[obstacle]['width'] + 2){
                            bounce_x = -core_storage_data['obstacle-multiplier'];
                        }
                    }
                },
              });

              // Check for collisions with player paddles or edges of game area.
              if(core_entities[entity]['y'] > core_entities['player-1']['paddle-y'] + core_entities['player-1']['paddle-height']
                && core_entities[entity]['y'] < core_entities['player-0']['paddle-y']){
                  if(Math.abs(core_entities[entity]['x']) < 88){
                      if(core_entities[entity]['y'] > 0){
                          if(core_entities[entity]['x'] > core_entities['player-0']['paddle-x'] - 2
                            && core_entities[entity]['x'] < core_entities['player-0']['paddle-x'] + core_entities['player-0']['paddle-width'] + 2
                            && core_entities[entity]['y-speed'] > 0
                            && core_entities[entity]['y'] + 2 >= core_entities['player-0']['paddle-y']){
                              core_entities[entity]['x-speed'] = Math.random() * (core_storage_data['particle-speed'] * 2) - core_storage_data['particle-speed'];
                              core_entities[entity]['owner'] = 'player-0';
                              bounce_y = -1;
                          }

                      }else if(core_entities[entity]['x'] > core_entities['player-1']['paddle-x'] - 2
                        && core_entities[entity]['x'] < core_entities['player-1']['paddle-x'] + core_entities['player-1']['paddle-width'] + 2
                        && core_entities[entity]['y-speed'] < 0
                        && core_entities[entity]['y'] - 2 <= core_entities['player-1']['paddle-y'] + core_entities['player-1']['paddle-height']){
                          core_entities[entity]['owner'] = 'player-1';
                          bounce_y = -1;
                      }

                  // Left/right wall collisions.
                  }else if(Math.abs(core_entities[entity]['x']) > particle_x_limit){
                      bounce_x = -1;

                  // Player paddle collisions.
                  }else if((core_entities[entity]['y-speed'] < 0 && core_entities[entity]['y'] - 2 <= core_entities['player-1']['paddle-y'] + core_entities['player-1']['paddle-height'])
                    || (core_entities[entity]['y-speed'] > 0 && core_entities[entity]['y'] + 2 >= core_entities['player-0']['paddle-y'])){
                      bounce_y = -1;
                  }
              }

              // Move core_entities.
              core_entities[entity]['x-speed'] *= bounce_x;
              core_entities[entity]['y-speed'] *= bounce_y;
              core_entities[entity]['x'] += core_entities[entity]['x-speed'];
              core_entities[entity]['y'] += core_entities[entity]['y-speed'];
          }
      },
    });

    // Calculate movement direction for next frame if player0 ai is tracking a particle.
    var paddle_position = core_entities['player-0']['paddle-x'] + core_entities['player-0']['paddle-width'] / 2;
    if(core_entities['player-0']['target'] === false){
        if(paddle_position === 0){
            core_entities['player-0']['paddle-x-move'] = 0;

        }else{
            core_entities['player-0']['paddle-x-move'] = paddle_position < 0
              ? 2
              : -2;
        }

    }else{
        core_entities['player-0']['paddle-x-move'] = core_entities[core_entities['player-0']['target']]['x'] > paddle_position
          ? 2
          : -2;
    }

    // Calculate movement direction for next frame if player1 ai is tracking a particle.
    paddle_position = core_entities['player-1']['paddle-x'] + core_entities['player-1']['paddle-width'] / 2;
    if(core_entities['player-1']['target'] === false){
        if(paddle_position === 0){
            core_entities['player-1']['paddle-x-move'] = 0;

        }else{
            core_entities['player-1']['paddle-x-move'] = paddle_position < 0
              ? 2
              : -2;
        }

    }else{
        core_entities['player-1']['paddle-x-move'] = core_entities[core_entities['player-1']['target']]['x'] > paddle_position
          ? 2
          : -2;
    }

    // Move player 1 paddle, prevent from moving past goal boundaries.
    core_entities['player-1']['paddle-x'] += core_entities['player-1']['paddle-x-move'];
    if(core_entities['player-1']['paddle-x'] > 20){
        core_entities['player-1']['paddle-x'] = 20;
    }else if(core_entities['player-1']['paddle-x'] < -90){
        core_entities['player-1']['paddle-x'] = -90;
    }

    // If player controlled, handle keypress movement...
    if(player_controlled){
        if(core_keys[65]['state']
          && core_entities['player-0']['paddle-x'] > -90){
            core_entities['player-0']['paddle-x'] -= 2;
        }else if(core_entities['player-0']['paddle-x'] < -90){
            core_entities['player-0']['paddle-x'] = -90;
        }
        if(core_keys[68]['state']
          && core_entities['player-0']['paddle-x'] < 20){
            core_entities['player-0']['paddle-x'] += 2;
        }else if(core_entities['player-0']['paddle-x'] > 20){
            core_entities['player-0']['paddle-x'] = 20;
        }

    // ...else move via AI.
    }else{
        core_entities['player-0']['paddle-x'] += core_entities['player-0']['paddle-x-move'];
        if(core_entities['player-0']['paddle-x'] > 20){
            core_entities['player-0']['paddle-x'] = 20;
        }else if(core_entities['player-0']['paddle-x'] < -90){
            core_entities['player-0']['paddle-x'] = -90;
        }
    }

    // End game if any player has >= score-goal score.
    core_group_modify({
      'groups': [
        'player',
      ],
      'todo': function(entity){
          if(core_entities[entity]['score'] >= core_storage_data['score-goal']){
              window.clearInterval(canvas_interval);
          }
      },
    });
}

function repo_init(){
    core_repo_init({
      'audios': {
        'boop': {
          'duration': .1,
        },
      },
      'entities': {
        'obstacle': {},
        'particle': {
          'properties': {
            'owner': false,
          },
        },
        'player': {
          'properties': {
            'goal-height': 20,
            'goal-width': 200,
            'goal-x': -100,
            'paddle-height': 5,
            'paddle-width': 70,
            'paddle-x': -35,
            'paddle-x-move': 0,
            'score': 0,
            'target': false,
          },
        },
        'spawner': {},
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
var particle_x_limit = 0;
var player_controlled = false;
