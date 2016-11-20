var express = require('express');
var app=express();
var path=require('path');
var http = require('http').Server(app);
var io = require('socket.io')(http);
//var emojify = require("emojify"); 
//var $ = require('jquery');
var nStatic = require('node-static');

/*TODO cosas obligatorias:
 * (x)entrar con un usuario
 * (x)Entrar a sala comun
 * (x)lista de usuarios conctados *se actualiza*
 * (x)trafico optimizado, mi mensaje no me lo manda el servidor
 * (x)se informa cuando alguien entra o sale
 * 
 *TODO funcionalidades planteadas
 * (x)permitir conversaciones privadas: haciendo clic en un usuario permite hablarle solo a el
 * (x)se informa cuando alguien está escribiendo
 * (x)enviar emoticonos
 *TODO otros/curiosidades:
 * (x)seguridad en el cliente tambien para evitar trafico innecesario
 * 		(x)comprueba si esta vacio o duplicado en cliente y servidor
 * 		(x)evita la introducción de eiquetas
 * (x)interfaz bonita WIP (work in progress)
 * (x)muestra error temporalmente si no puede loguear
 * (x)scroll automatico
 * (x)pone el codigo automático de emoticonos y mensajes privados
 * (x)desconecta por inactividad (10 min)
 * (x)imagen se redimensiona sola con calc() en el css
 * ( )sistema votacion para echar a un usuario
 */

io.listen(app.listen(process.env.PORT || 1337));
//variables
var usuarios={};

//definir ruta por defecto
app.use(express.static("public"));



//escuchar
app.get('*', function(req, res){
	//res.sendFile(__dirname + '/chat.html');
	res.redirect('chat.html');
});
//conexión con alguin
io.on('connection', function(socket){
	
	//usuario se conecta
	console.log('se ha conectado "'+socket.id+'"');
	io.sockets.emit("update",usuarios); //enviamos la lista de usuarios para que el cliente compruebe
	
	//usuario inicia sesion
	socket.on("login",function(usuario){ 
		
		var valido=true;

		if(usuario.trim==''){
			valido=false;			
		}else if(usuario.split(":")[1]!=undefined){
            valido=false;
        }else if(usuario.trim()=='yo'){
            valido=false;
        }else if(/<(.|\n)*?>/i.test(usuario)){ 
            valido=false;
        }else{
			for (var v in usuarios) {
				if (usuario==v){
					console.log(v+" - "+usuarios[v]);
					valido=false;
					console.log(socket.id +" intenta entrar con nombre duplicado");
				}
			}

		}
			
		if(valido){//si el usuario es correcto
			socket.username = usuario;	
			usuarios[socket.id]=usuario;
				
			socket.emit("mensaje",{mensaje :"Hola "+ socket.username + ", bienvenido al chat"});
			socket.broadcast.emit("mensaje",{ mensaje : socket.username +" entro al chat"});
			
			console.log('"'+socket.id +'" se ha conectado como "'+socket.username+'"');		
		
			io.sockets.emit("update",usuarios);
		}else{
			socket.emit("errLogin", {mensaje: "Error al iniciar sesión"})
		}
		
		
	});	

    //alguien envia un mensaje
    socket.on('mensaje',function(mensaje){
    	console.log('nuevo mensaje de "'+ socket.username +'": "'+ mensaje+'"');
		//io.emit('chat', mensaje);
		socket.broadcast.emit('mensaje', {"mensaje": socket.username+ " ha dicho: "+mensaje});
    });
    //algien susurra alguin, 
	socket.on('whisper',function(usuario,mensaje){ //mensaje privado
		console.log('nuevo mensaje de "'+ socket.username +'" a "'+usuario+'": "'+ mensaje+'"');
		

		var id;
		for( socket.id in usuarios){
			if(usuarios[socket.id]==usuario){
				
				//podría controlar que no mande a uno mismo pero me siento solo :(
				io.to(socket.id).emit('mensaje', {"mensaje": socket.username+ " te ha susurrado: "+mensaje}); 
				
			}
		} 
	
	});
	
	socket.on('writing',function(data){ //data es boolean si escribe o no
		//hasta aqui llega bien
		socket.broadcast.emit("escribiendo",{estaEscribiendo: data, usuario: usuarios[socket.id]});


	})
	
	socket.on('disconnect', function(){		
        console.log('se ha desconectado "'+socket.id+'"');
		io.sockets.emit('mensaje', {"mensaje": "Se ha desconectado "+usuarios[socket.id]+" :("});      
        delete usuarios[socket.id];
        socket.broadcast.emit("escribiendo",{estaEscribiendo: false, usuario: usuarios[socket.id]});
        io.sockets.emit("update",usuarios); 
    });  
});
/*
ComprobarUsuario=function(nombre){
	var valido=true;
	
	if($.trim(nombre)==''){
		valido=false;console.log("nombre vacio");
	}else{
		console.log("no esta vacio, prueba duplicado");
		$.each(usuarios,function(k,v){
			if (nombre==v){
				valido=false;console.log("duplicado");
			}
		});	
	}
	return valido;
};
*/




