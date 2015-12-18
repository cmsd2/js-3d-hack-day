(function() {
    var filterStrength = 20;
    var t = 0.0;
    var dt = 1 / 60.0;
    var oldFrameTime = 0;

    var currentTime = new Date;

window.game_loop = function game_loop()
{
    var newTime = new Date;
    var frameTime = (newTime - currentTime) / 1000.0;
    currentTime = newTime;

    oldFrameTime += (frameTime - oldFrameTime) / filterStrength;
    window.fps(oldFrameTime);
   
    if ( frameTime > 0.0 )
    {
        var deltaTime = Math.min( frameTime, dt );
        window.integrate( window.state, t, deltaTime );
        frameTime -= deltaTime;
        t += deltaTime;
    }

    window.render( window.state );

    requestAnimationFrame(game_loop);
}

})();