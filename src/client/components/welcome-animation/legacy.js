
var TextureManager =
{
    //allows reusing images for different keys
    //load: function(textures, complete, convertToCanvas)
    load: function(options)
    {
        var opts = Object.assign(
        {
            baseURL:'',
            textures:{},
            complete:function(){},
            convertToCanvas:false
        }, options);
        var total = 0, loaded = 0;
        var convertToCanvas = opts.convertToCanvas, textures = opts.textures, complete = opts.complete;
        var loadedTextures = {};
        
        function getImagesList(textures)
        {
            var list = {};
            for (var id in textures)
            {
                if (typeof(textures[id]) == "string")
                {
                    list[textures[id]] = true;
                }else
                {
                    var l = getImagesList(textures[id]);
                    list = Object.assign(list, l);
                }
            }
            return list;
        }
        function assignTextures(textures, loadedImages)
        {
            for (var id in textures)
            {
                if (typeof(textures[id]) == "string")
                {
                    textures[id] = loadedImages[textures[id]];
                }else
                {
                    assignTextures(textures[id], loadedImages)
                }
            }
        }
        var imagesToLoad = getImagesList(textures);
        for (var id in imagesToLoad)
        {
            var img = new Image();
            img.id = id;
            img.src = opts.baseURL + id;
            img.dataId = id;
            img.onload = function()
            {
                loaded++;
                if (convertToCanvas)
                {
                    loadedTextures[this.dataId] = Graphics.img2canvas({img:this});
                }else
                {
                    loadedTextures[this.dataId] = this;
                }
                loadComplete();
            };
            img.onerror = function()
            {
                loaded++;
                loadComplete();
            };
            total++;
        }
        function loadComplete()
        {
            if (loaded == total)
            {
                assignTextures(textures, loadedTextures);
                complete();
            }
        }
        if (total == 0)
            loadComplete();
    }
};
var engine =
{
    layers:[],
    scene: null,
    started: false,
    paused: false,
    pausedTime: 0,
    canvas: null,
    ctx: null,
    animationAttached: false,
    frames: 0,
    startTime: Date.now(),
    runOnUpdate: [],
    runOnUpdateCallbacks: [],
    frameDuration: 0,
    lastRenderTime: Date.now(),
    init: function()
    {
        engine.started = false;
        engine.paused = false;
        window.requestAnimFrame = (function()
        {
            return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function(callback, element)
            {
                //window.setTimeout(engine.render, 1000 / 60);
                window.setTimeout(engine.render, 0);
            }
            return function(callback, element)
            {
                window.setTimeout(callback, 100);
            }
        })();
        if (!engine.animationAttached)
        {
            window.requestAnimFrame(engine.render);
            engine.animationAttached = true;
        }
        engine.currentTime = Date.now();
    },
    start: function()
    {
        engine.started = true;
        for (var i = 0, len = engine.layers.length; i < len; i++)
            engine.layers[i].start();
    },
    pause: function()
    {
        engine.paused = true;
        engine.pausedTime = engine.currentTime;
        for (var i = 0, len = engine.layers.length; i < len; i++)
            engine.layers[i].pause();
    },
    resume: function()
    {
        engine.paused = false;
        for (var i = 0, len = engine.layers.length; i < len; i++)
            engine.layers[i].resume();
    },
    stop: function()
    {
        engine.started = false;
        engine.paused = false;
        engine.layers = [];
        engine.canvas.onClick = null;
    },
    render: function()
    {
        engine.currentTime = Date.now();
        if (!engine.started || engine.paused)
        {
            window.requestAnimFrame(engine.render);
            engine.lastRenderTime = engine.currentTime;
            engine.frameDuration = 0;
            return;
        }
        if (engine.runOnUpdateCallbacks.length)
        {
            while (engine.runOnUpdateCallbacks.length)
            {
                var c = engine.runOnUpdateCallbacks.pop();
                c();
            }
        }
        for (var i = 0, len = engine.layers.length; i < len; i++)
            engine.layers[i].render();
    
        engine.frames++;
        var timeDiff = engine.currentTime - engine.startTime;
        if (timeDiff > 1000)
        {
            engine.startTime = engine.currentTime;
            engine.frames = 0;
        }
        engine.frameDuration = engine.currentTime - engine.lastRenderTime;
        engine.frameDuration = Math.min(1000 / 16, engine.frameDuration);
        engine.frameDuration = Math.max(0, engine.frameDuration);
        engine.lastRenderTime = engine.currentTime;
        window.requestAnimFrame(engine.render);
    },
    addLayer: function(layer)
    {
        engine.layers.push(layer);
    },
    runOnUpdate: function(callback)
    {
        engine.runOnUpdateThread(callback);
    },
    runOnUpdateThread: function(callback)
    {
        engine.runOnUpdateCallbacks.push(callback);
    }
};
var Layer = function(options)
{
    var me = this;
    var opts = Object.assign({canvas:null, autoInvalidate:true}, options);
    me.ctx = opts.canvas ? opts.canvas.getContext('2d') : null;
    me.width = opts.canvas ? opts.canvas.width : 0;
    me.height = opts.canvas ? opts.canvas.height : 0;
    me.children = [];//array of sprites
    me.alpha = 1;
    me.dirty = false;
    me.invalidate = function()
    {
        me.dirty = true;
    };
    me.appendChild = function(sprite)
    {
        sprite.parent = me;
        me.children.push(sprite);
    };
    me.removeChild = function(sprite)
    {
        for (var i = 0, len = me.children.length; i < len; i++)
        {
            if (me.children[i] === sprite)
            {
                me.children.splice(i, 1);
                break;
            }
        }
    };
    me.sortChildren = function()
    {
        me.children.sort(function (a,b)
        {
            return a.zIndex - b.zIndex;
        });
    };
    me.start = function()
    {
        for (var i = 0, len = me.children.length; i < len; i++)
            me.children[i].startModifier();
    };
    me.pause = function()
    {
        for (var i = 0, len = me.children.length; i < len; i++)
            me.children[i].pauseModifier();
    };
    me.resume = function()
    {
        for (var i = 0, len = me.children.length; i < len; i++)
            me.children[i].resumeModifier();
    };
    me.render = function()
    {
        var dt = engine.frameDuration / 1000;
        for (var i = 0, len = me.children.length; i < len; i++)
            me.children[i].update(dt);
        if (me.dirty)
        {
            if (me.ctx)
                me.ctx.clearRect(0, 0, me.width, me.height);
            for (var i = 0, len = me.children.length; i < len; i++)
                me.children[i].render(me.ctx);
        }
        me.dirty = opts.autoInvalidate;
    };
    me.onClick = function(callback)
    {
        opts.canvas.onclick = function(e)
        {
            var offset = {top:e.clientX, left:e.clientY};
            var x = e.pageX - offset.left;
            var y = e.pageY - offset.top;
            callback(x, y);
        };
    };
};

//sprites with dimensions power of two have much better performance
var Sprite = function(options)
{
    var me = this;
    var opts = Object.assign({x:0, y:0, width:0, texture:null, shading:null, height:0, alpha:1, scale:1, scaleX:1.0, scaleY:1.0, rotate:0, zIndex:1, center:null}, options);
    me.data = {};
    me.x = opts.x;
    me.y = opts.y;
    me.scaleX = opts.scaleX;
    me.scaleY = opts.scaleY;
    //me.scale = opts.scale;
    me.alpha = opts.alpha;
    me.texture = opts.texture;
    me.visible = true;
    me.modifiers = [];
    me.width = me.texture ? me.texture.width : opts.width;
    me.height = me.texture ? me.texture.height : opts.height;
    me.rotate = opts.rotate;
    me.zIndex = opts.zIndex;
    me.children = [];
    me.parent = null;
    me.beforeUpdateCallbacks = [];
    me.afterUpdateCallbacks = [];
    //graphics.drawText(me.texture, "12", Math.round(me.texture.width / 2), Math.round(me.texture.height / 2), 40, 50, 50, Color.BLACK);
    var centerX = opts.center ? opts.center.x : Math.round(me.width / 2),
        centerY = opts.center ? opts.center.y : Math.round(me.height / 2);
    me.clone = function()
    {
        //clones object without modifiers
        return new Sprite(
        {
            x:me.x,
            y:me.y,
            width:me.width,
            height:me.height,
            texture:me.texture,
            shading:null,
            alpha:me.alpha,
            scaleX:me.scaleX,
            scaleY:me.scaleY,
            //scale:me.scale,
            rotate:me.rotate,
            zIndex:me.zIndex,
            center:null
        });
    };
    me.setRotationCenter = function(x, y)
    {
        centerX = x != null ? x : centerX;
        centerY = y != null ? y : centerY;
    };
    me.recalcCenter = function()
    {
        centerX = Math.round(me.width / 2);
        centerY = Math.round(me.height / 2);
    };
    me.render = function(ctx)
    {
        if (!me.visible)
            return;
        var alpha = me.alpha;
        var p = me.parent;
        while(p)
        {
            alpha *= p.alpha;
            p = p.parent;
        }
        if (me.texture)
        {
            ctx.save();
            //console.log('alpha', alpha);
            //ctx.globalAlpha = me.alpha * (me.parent ? me.parent.alpha : 1);
            ctx.globalAlpha = alpha;
            ctx.translate(me.x + centerX, me.y + centerY);
            ctx.rotate(utils.d2r(me.rotate));
            //ctx.scale(me.scale || 0.0001, me.scale || 0.0001);
            ctx.scale(me.scaleX || 0.0001, me.scaleY || 0.0001);
            if (me.texture instanceof SpriteSheetFrame)
            {
                var dw = me.texture.trimmedWidth;
                var dh = me.texture.trimmedHeight;
                ctx.drawImage(
                    me.texture.getTexture(),
                    me.texture.sx,
                    me.texture.sy,
                    me.texture.sw,
                    me.texture.sh,
                    -centerX + me.texture.ox, -centerY + me.texture.oy, dw, dh);
            }else
                ctx.drawImage(me.texture, -centerX, -centerY);
            ctx.restore();
        }
        ctx.save();
        //ctx.globalAlpha = me.alpha * (me.parent ? me.parent.alpha : 1);
        ctx.globalAlpha = alpha;
        ctx.translate(me.x + centerX, me.y + centerY);
        ctx.rotate(utils.d2r(me.rotate));
        //ctx.scale(me.scale || 0.0001, me.scale || 0.0001);
        ctx.scale(me.scaleX || 0.0001, me.scaleY || 0.0001);
        ctx.translate(-centerX, -centerY);
        //TODO:opacity handling
        for (var i = 0, len = me.children.length; i < len; i++)
            me.children[i].render(ctx);
        ctx.restore();
        //console.log("render", me.x, me.y);
    };
    me.update = function(dt)
    {
        /*if (!me.visible)
            return;*/
        for (var i = 0, len = me.beforeUpdateCallbacks.length; i < len; i++)
            me.beforeUpdateCallbacks[i].call(me, dt);
        for (var i = 0, len = me.modifiers.length; i < len; i++)
            me.modifiers[i].update(dt);
        for (var i = 0, len = me.children.length; i < len; i++)
            me.children[i].update(dt);
        for (var i = 0, len = me.afterUpdateCallbacks.length; i < len; i++)
            me.afterUpdateCallbacks[i].call(me, dt);
    };
    me.attachModifier = function(modifier)
    {
        me.modifiers.push(modifier);
        modifier.setTarget(me);
        if (engine.started)
            modifier.start();
    };
    me.removeModifiers = function()
    {
        me.modifiers = [];
    };
    me.removeModifier = function(modifier)
    {
        for (var i = 0, len = me.modifiers.length; i < len; i++)
        {
            if (me.modifiers[i] === modifier)
            {
                me.modifiers.splice(i, 1);
                break;
            }
        }
    };
    me.setVisibility = function(visibility)
    {
        me.visible = visibility;
    };
    me.startModifier = function()
    {
        for (var i = 0, len = me.modifiers.length; i < len; i++)
            me.modifiers[i].start();
    };
    me.pauseModifier = function()
    {
        for (var i = 0, len = me.modifiers.length; i < len; i++)
            me.modifiers[i].pause();
    };
    me.resumeModifier = function()
    {
        for (var i = 0, len = me.modifiers.length; i < len; i++)
            me.modifiers[i].resume();
    };
    me.hitTest = function(x, y)
    {
        return (x >= me.x && y >= me.y && x <= (me.x + me.width * me.scaleX) && y <= (me.y + me.height * me.scaleY));
    };
    me.deepHitTest = function(x, y)
    {
        var baseX = 0, baseY = 0;
        var o = me.parent;
        while (!(o instanceof Layer))
        {
            baseX += o.x;
            baseY += o.y;
            o = o.parent;
        }
        x -= baseX;
        y -= baseY;
        return (x >= me.x && y >= me.y && x <= (me.x + me.width * me.scaleX) && y <= (me.y + me.height * me.scaleY));
    };
    /*me.checkOverlap = function(x, y, width, height)
    {
        return !((me.x + me.width * me.scale) < x || (me.y + me.height * me.scale) < y || me.x > (x + width) || me.y > (y + height));
    };*/
    me.checkOverlap = function(sprite)
    {
        return !((me.x + me.width * me.scaleX) <= sprite.x || (me.y + me.height * me.scaleY) <= sprite.y || me.x >= (sprite.x + sprite.width * sprite.scaleX) || me.y >= (sprite.y + sprite.height * sprite.scaleY));
    };
    me.getWidth = function()
    {
        return Math.round(me.width * me.scaleX);
    };
    me.getHeight = function()
    {
        return Math.round(me.height * me.scaleY);
    };
    me.setPosition = function(x, y)
    {
        me.x = x;
        me.y = y;
    };
    me.appendChild = function(sprite)
    {
        sprite.parent = me;
        me.children.push(sprite);
    };
    me.removeChild = function(sprite)
    {
        for (var i = 0, len = me.children.length; i < len; i++)
        {
            if (me.children[i] === sprite)
            {
                me.children[i].parent = null;
                me.children.splice(i, 1);
                break;
            }
        }
    };
    me.sortChildren = function()
    {
        me.children.sort(function (a,b)
        {
            /*if (a.zIndex == b.zIndex)
                return 0;
            if (a.zIndex > b.zIndex)
                return 1;
            return -1;*/
            return a.zIndex - b.zIndex;
        });
    };
    me.onBeforeUpdate = function(callback)
    {
        me.beforeUpdateCallbacks.push(callback);
    };
    me.onAfterUpdate = function(callback)
    {
        me.afterUpdateCallbacks.push(callback);
    };
    me.clearOnUpdate = function()
    {
        me.beforeUpdateCallbacks = [];
        me.afterUpdateCallbacks = [];
    };
    me.getRect = function()
    {
        //for collisions
        //do not care about scale
        var p = [];
        p.push({x:this.x, y:this.y});
        p.push({x:this.x + this.width, y:this.y});
        p.push({x:this.x + this.width, y:this.y + this.height});
        p.push({x:this.x, y:this.y + this.height});
        return p;
    };
    me.center = function()
    {
        me.centerX();
        me.centerY();
    };
    me.centerX = function()
    {
        me.x = ~~((me.parent.width - me.width) / 2);
    };
    me.centerY = function()
    {
        me.y = ~~((me.parent.height - me.height) / 2);
    };
};


var getRandom = function(arr)
{
	if (arr.length > 1)
	{
		var index = Math.round(Math.random() * (arr.length - 1));
		return arr[index];
	}else if (arr.length > 0)
		return arr[0];
	return null;
		
};
function normalizeVec(v)
{
    var l = Math.sqrt(v.x * v.x + v.y * v.y);
    v.x = v.x / l;
    v.y = v.y / l;
    return v;
}

function Vector(x, y) {
    this.x = x || 0;
    this.y = y || 0;
}

// Add a vector to another
Vector.prototype.add = function(vector) {
  this.x += vector.x;
  this.y += vector.y;
}
 
// Gets the length of the vector
Vector.prototype.getMagnitude = function () {
  return Math.sqrt(this.x * this.x + this.y * this.y);
};
 
// Gets the angle accounting for the quadrant we're in
Vector.prototype.getAngle = function () {
  return Math.atan2(this.y,this.x);
};
 
// Allows us to get a new vector from angle and magnitude
Vector.fromAngle = function (angle, magnitude) {
  return new Vector(magnitude * Math.cos(angle), magnitude * Math.sin(angle));
};
 
function Particle(options)
{
    var opts = Object.assign(
    {
        x:0, y:0,
        gx:0, gy:0, gv:100,
        agx:0, agy:0, agv:100, agr:50,
        chaos:true
    }, options);
    var me = this;
    me.x = opts.x;
    me.y = opts.y;
    me.vx = 0;
    me.vy = 0;
    me.speed = 0;
    me.gx = opts.gx;
    me.gy = opts.gy;
    me.gv = opts.gv;
    //anti gravity point
    me.agx = opts.agx;
    me.agy = opts.agy;
    me.agv = opts.agv;
    me.agr = opts.agr;
    me.chaos = opts.chaos;
    me.update = function(dt)
    {
        //distance to gravity center
        var dx = (me.gx - me.x), dy = (me.gy - me.y);
        var gravity = me.gv;
        var index = ~~(dx * dx + dy * dy);
        var dist = Math.sqrt(index);
        //var dist = sqrtLookup[index];
        if (dist == 0)
        {
            dx = dy = 0;
            //me.vx = 0.1;
            //me.vy = 0.1;
        }else
        {
            dx = dx * gravity / dist;
            dy = dy * gravity / dist;
        }
        me.vx += dx;
        me.vy += dy;
        if (me.chaos && dist < 60)
        {
            me.gx = utils.Rnd(600) + 100;
            me.gy = utils.Rnd(400) + 100;
        }
        
        //anti gravity
        var dx = -(me.agx - me.x), dy = -(me.agy - me.y);
        var index = ~~(dx * dx + dy * dy);
        var dist = Math.sqrt(index);
        //var dist = sqrtLookup[index];
        var antiGravity = me.agv;
        if (dist == 0)
        {
            dx = dy = 0;
        }else
        {
            if (dist < me.agr)
            {
                dx = dx * antiGravity / dist;
                dy = dy * antiGravity / dist;

                me.vx += dx;
                me.vy += dy;
                
            }
        }
        //speed down
        me.vx *= (1 - 2 * dt);
        me.vy *= (1 - 2 * dt);
        
        me.x = ~~(me.x + me.vx * dt);
        me.y = ~~(me.y + me.vy * dt);
    };
}
var utils = {
    isInt: function(n) {
	    return n % 1 == 0;
    },
    Rnd: function (max)
    {
        if (utils.isInt(max))
        {
            return Math.round(Math.random() * max);
        }else
            return Math.random() * max;
    }
}
export default {
    eventHandlers: {
        click: null,
        move: null
    },
    start: function(img1, img2, canvas, text) {
        var textures =
        {
            particle:img1,
            gravity:img2
        };
        TextureManager.load(
        {
            textures:textures,
            complete: function()
            {
                var sqrtLookup = [];
                var canvas1 = document.createElement('canvas');
                canvas1.width = canvas.width;
                canvas1.height = canvas.height;
                var ctx1 = canvas1.getContext('2d');
                
                var fontSize = 20;
                ctx1.font = fontSize + 'px sans-serif';
                ctx1.textAlign = 'left';
                ctx1.textBaseline = 'top';
                ctx1.fillStyle = '#fff';
                var mt = ctx1.measureText(text);
                canvas1.width = mt.width;
                canvas1.height = fontSize;
                ctx1.font = fontSize + 'px sans-serif';
                ctx1.textAlign = 'left';
                ctx1.textBaseline = 'top';
                ctx1.fillStyle = '#fff';
                ctx1.fillText(text, 0, 0);
                var d = ctx1.getImageData(0, 0, canvas1.width, canvas1.height);
                var pos = [];
                for (var i = 0, len = d.data.length; i < len; i += 4)
                {
                    if (d.data[i + 3] > 128)
                    {
                        var x = ((i / 4) % d.width), y = ~~((i / 4) / d.width);
                        pos.push({x:x, y:y});
                    }
                }
                var cellSize = ~~(700 / d.width), offsetX = canvas.width / 2 - cellSize * d.width / 2, offsetY = canvas.height / 2 - cellSize * d.height / 2;
                var toggleText = true;
                
                for (var i = 0; i < 1000000; i++)
                {
                    sqrtLookup.push(Math.sqrt(i));
                }
                var mainLayer = new Layer({canvas:canvas, autoInvalidate:true});
                engine.addLayer(mainLayer);
                var s = new Sprite();
                
                s.onBeforeUpdate(function(dt)
                {
                    for (var i = 0, len = particles.length; i < len; i++)
                    {
                        particles[i].data.particle.update(dt);
                        particles[i].x = particles[i].data.particle.x - particles[i].width / 2;
                        particles[i].y = particles[i].data.particle.y - particles[i].height / 2;
                    }
                });
                s.render = function(ctx)
                {
                    for (var i = 0, len = particles.length; i < len; i++)
                    {
                        ctx.drawImage(particles[i].texture, particles[i].x, particles[i].y);
                    }
                };
                mainLayer.appendChild(s);
                var centerX = 400, centerY = 300;
                var particlesAmount = pos.length + 30;
                var particles = [];
                for (var i = 0; i < particlesAmount; i++)
                {			
                    var p = new Sprite({texture:getRandom([textures.particle, textures.gravity])});
                    p.data.particle = new Particle({x:100, y:100, gx:200, gy:200, gv:10, agv:35, agr:60, chaos:true});
                    
                    var radius = 400, angle = Math.random() * 2 * Math.PI;
                    var x = centerX + ~~(radius * (1 + Math.random()) * Math.sin(angle));
                    var y = centerY + ~~(radius * (1 + Math.random()) * Math.cos(angle));
                    p.data.particle.x = x;
                    p.data.particle.y = y;
                    if (i < pos.length)
                    {
                        var target = pos[i];
                        p.data.particle.gx = target.x * cellSize + offsetX;
                        p.data.particle.gy = target.y * cellSize + offsetY;
                        p.data.particle.chaos = false;
                    }else
                    {
                        p.data.particle.gx = utils.Rnd(600) + 100;
                        p.data.particle.gy = utils.Rnd(400) + 100;
                    }
                    p.x = p.data.particle.x - p.width / 2;
                    p.y = p.data.particle.y - p.height / 2;
                        
                    p.onBeforeUpdate(function(dt)
                    {
                        this.data.particle.update(dt);
                        this.x = this.data.particle.x - this.width / 2;
                        this.y = this.data.particle.y - this.height / 2;
                    });
                    p.render = function(ctx)
                    {
                        ctx.drawImage(this.texture, this.x, this.y);
                    };

                    var g = new Sprite({texture:textures.gravity});
                    g.visible = false;
                    g.x = p.data.particle.gx - g.width / 2;
                    g.y = p.data.particle.gy - g.height / 2;
                    particles.push(p);
                }
                
                engine.init();
                engine.start();
                canvas.onclick = function(e)
                {
                    toggleText = !toggleText;
                    
                    if (toggleText)
                    {
                        for (var i = 0, len = particles.length; i < len && i < pos.length; i++)
                        {
                            var target = pos[i];
                            particles[i].data.particle.gx = target.x * cellSize + offsetX;
                            particles[i].data.particle.gy = target.y * cellSize + offsetY;
                            particles[i].data.particle.chaos = false;
                        }
                    }else
                    {
                        for (var i = 0, len = particles.length; i < len; i++)
                        {
                            particles[i].data.particle.chaos = true;
                        }
                    }
                };
                canvas.onmousemove = function(e)
                {
                    var pos = this.getBoundingClientRect();
                    var x, y;
                    x = e.clientX - pos.left;
                    y = e.clientY - pos.top;
                    for (var i = 0, len = particles.length; i < len; i++)
                    {
                        particles[i].data.particle.agx = x;
                        particles[i].data.particle.agy = y;
                    }
                };
            }
        });
    },
    destroy: function() {

    }
};