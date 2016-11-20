var socket = io();
/*********Cajas**********/
var login=$('#login'); //login
var aviso=$('#aviso'); //mensajes de error
var cuerpo=$('#cuerpo'); //chat

var nick=$('#usuario'); //nicke del login
var mAviso=$('#modalText');//texto mensaje de error
var cajaMensaje=$('#mensaje');//texto a enviar

//cajaMensaje
var usuarios=$('#usuarios'); //lista de usuarios
var cuerpoMensajes=$('#mensajes'); //lista de mensajes
var emojis=$('#listaEmoji'); //lista de emojis

var lastMessage=cuerpoMensajes.children().last()

var flogin=$('form').eq(0);
var fenviar=$('form').eq(1);

var escribe=$('#escribe'); //donde aparece si alguien escribe

var typing = false;  
var timeout=undefined;
var wisper=false;
var erwisper="decir,"
var listaUsuarios=[];
//$('cajaMensaje').focus();

/*TODO cosas obligatorias:
 * (x)entrar con un usuario
 * (x)Entrar a sala comun
 * (x)lista de usuarios conctados *se actualiza*
 * (x)trafico optimizado, 
 *      (x)mi mensaje no me lo manda el servidor
 *      (x)comprueba si el usuario es correcto antes de enviar al servidor
 * (x)se informa cuando alguien entra o sale
 * 
 *TODO funcionalidades planteadas
 * (x)permitir conversaciones privadas: haciendo clic en un usuario permite hablarle solo a el
 * (x)se informa cuando alguien está escribiendo
 * (x)enviar emoticonos
 * 
 *TODO otros/curiosidades:
 * (x)seguridad en el servidor tambien para evitar que se salte la seguridad en el cliente
 *      (x)comprueba si esta vacio o duplicado en cliente y servidor
 *      (x)evita la introducción de eiquetas
 * (x)interfaz bonita WIP (work in progress)
 * (x)muestra error temporalmente si no puede loguear
 * (x)scroll automatico
 * (x)pone el codigo automático de emoticonos y mensajes privados
 * (x)desconecta por inactividad (10 min)
 * (x)imagen se redimensiona sola con calc() en el css
 * ( )sistema votacion para echar a un usuario
 */


login.ready(function(){
	aviso.toggle();
	cuerpo.toggle();
	nick.focus();
});

cuerpo.ready(function(){
    poneEmoji=function(mensaje){//poner emoji en el mensaje
        //seguridad si quiero poner emoji, ya que uso .html en vez de .text
        mensaje=mensaje.replace(/<(.|\n)*?>/g,'');

        mensaje=mensaje.replace(/\:\)/g,"<img class='emoji' src='images/emoji/blush.png'/>");
        mensaje=mensaje.replace(/\>\:\(/g ,"<img class='emoji' src='images/emoji/angry.png'/>");
        mensaje=mensaje.replace(/\:\(/g,"<img class='emoji' src='images/emoji/disappointed_relieved.png'/>");
        mensaje=mensaje.replace(/XO/g,"<img class='emoji' src='images/emoji/dizzy_face.png'/>");
        mensaje=mensaje.replace(/\:\|/g,"<img class='emoji' src='images/emoji/neutral_face.png'/>");
        mensaje=mensaje.replace(/\:O/g,"<img class='emoji' src='images/emoji/open_mouth.png'/>");
        mensaje=mensaje.replace(/\X\(/g,"<img class='emoji' src='images/emoji/persevere.png'/>");
        mensaje=mensaje.replace(/XD/g,"<img class='emoji' src='images/emoji/satisfied.png'/>");
        mensaje=mensaje.replace(/\:D/g,"<img class='emoji' src='images/emoji/smiley.png'/>");
        mensaje=mensaje.replace(/T\.T/g,"<img class='emoji' src='images/emoji/sob.png'/>");
        mensaje=mensaje.replace(/\:P/g,"<img class='emoji' src='images/emoji/stuck_out_tongue.png'/>");
        mensaje=mensaje.replace(/\-\_\-U/g,"<img class='emoji' src='images/emoji/sweat.png'/>");
        mensaje=mensaje.replace(/DX/g,"<img class='emoji' src='images/emoji/tired_face.png'/>");       
        mensaje=mensaje.replace(/DOOM/g,"<img class='emoji' src='images/emoji/suspect.png'/>");
        mensaje=mensaje.replace(/space invader/g,"<img class='emoji' src='images/emoji/space_invader.png'/>");

        return mensaje;
        
    };
	desconectar=function(){
	    timeout=undefined;
	    location.reload(true); 
	}
	
	noEscribe=function() {  //quita automaticamente el escribiendo
		socket.emit("writing", false);
	}
	
	
	cajaMensaje.keypress(function(key){ //si escribe lo dice y pone temporizador
		if (key.which != 13) {
	    	if (cajaMensaje.is(":focus")){
	    		socket.emit("writing", true);
	    		setTimeout(noEscribe, 5000);
	    	}else{
	    	socket.emit("writing", false);
	    }
	    }else{
	    	socket.emit("writing", false);
	    }
	    
	});
	ocultarAviso=function(){
	    aviso.hide();
	}
	
	comprobarNombre=function(nombre){ //comprueba si ya está en uso o si está en blanco
		var isCorrect=true;
		var error="Error al iniciar sesión: ";
		if($.trim(nombre)==''){
			mAviso.text(error+" Escribe algo, vago");
			aviso.show();
			isCorrect= false;console.log("nombre vacio");
		}else if(nombre.split(":")[1]!=undefined){
			mAviso.text(error+' no puede contener ":"');
			aviso.show();
			isCorrect= false;
		}else if($.trim(nombre)=='yo'){
			mAviso.text(error+' no soy yo, eres tu');
			aviso.show();
			isCorrect=false;
		}else if(/<(.|\n)*?>/i.test(nombre)){ 
		    mAviso.text(poneEmoji(error+" nice try campeón ;)"));
		    aviso.show();
		    isCorrect=false;
		}else{
			console.log("no esta vacio, prueba duplicado");
			$.each(usuarios.children(),function(){
				if (nombre==$(this).text()){
					mAviso.text(" Demasiado lento, ya está en uso");
					aviso.show();
					isCorrect= false;console.log("duplicado");
				}
				console.log("usuario this "+$(this).text());
			});			
		}
		setTimeout(ocultarAviso, 2000);
		return isCorrect;		
	};
    
    preparaEmoji();
});

preparaEmoji=function(){//poner todos los emoji en el menú
    //var lemoji=$('#listaEmoji:last-child');
    var listaEm=[
        {"simbolo": ":)", "url": "images/emoji/blush.png"},
        {"simbolo": ">:(", "url": "images/emoji/angry.png"},
        {"simbolo": ":(", "url": "images/emoji/disappointed_relieved.png"},
        {"simbolo": "XO", "url": "images/emoji/dizzy_face.png"},
        {"simbolo": ":|", "url": "images/emoji/neutral_face.png"},
        {"simbolo": ":O", "url": "images/emoji/open_mouth.png"},
        {"simbolo": "X(", "url": "images/emoji/persevere.png"},
        {"simbolo": "XD", "url": "images/emoji/satisfied.png"},
        {"simbolo": ":D", "url": "images/emoji/smiley.png"},
        {"simbolo": "T.T", "url": "images/emoji/sob.png"},
        {"simbolo": ":P", "url": "images/emoji/stuck_out_tongue.png"},
        {"simbolo": "-_-U", "url": "images/emoji/sweat.png"},
        {"simbolo": "DX", "url": "images/emoji/tired_face.png"},
        {"simbolo": "DOOM", "url": "images/emoji/suspect.png"},
        {"simbolo": "space invader", "url": "images/emoji/space_invader.png"}
    ];
    
    $.each(listaEm,function(pos,em){
        emojis.append($('<img>'));
        emojis.children().eq(pos).click(function() { 
            var texto=cajaMensaje.val;
            cajaMensaje.val(cajaMensaje.val()+em.simbolo+" ");
            cajaMensaje.focus();
        })
        .attr("src",em.url)
        .attr("class","emoji");
               
    });

};


/****************FORMULARIOS****************/


flogin.submit(function(event){ //inicia sesion
	event.preventDefault();
	var nombre=nick.val();	
	socket.emit('usuario', nombre);
	
	if(comprobarNombre(nombre)){
		socket.emit('login', nombre);
		login.toggle();
		cuerpo.toggle();
		cajaMensaje.focus();
		timeout = setTimeout(desconectar, 600000);
	}
	
});

fenviar.submit(function(){
	var texto=cajaMensaje.val(); console.log('mensaje "'+texto+'"' );
	if($.trim(texto)!=''){//si la caja no está en blanco
		var meta=texto.split(":")[0]; //datos del susurro, si lo hay
		console.log("envia");
		if(meta.split(" ")[0]=="/w"){wisper=true;}//correcto
		
		if (wisper){
		    
			console.log("privado");
			var mensaje=""; //por si mete algun ":" no se corte el mensaje
			
			for(var i=1;i<texto.split(":").length;i++){
			    //como nos quita los ":" de los emojis se lo tenemos que poner de nuevo
			    mensaje=mensaje+":"+texto.split(":")[i] 
			}console.log(mensaje);
			
			var usuario = meta.split(" ")[1]; //	
			socket.emit('whisper',usuario, mensaje);
			cuerpoMensajes.append($('<li>').html( "susurro a "+usuario+" "+poneEmoji(mensaje)));
			cajaMensaje.val('');
			wisper=false;
			
		}else{
		    
			console.log("publico");
			socket.emit('mensaje', cajaMensaje.val());
			cuerpoMensajes.append($('<li>').html( "yo : "+poneEmoji(cajaMensaje.val())));
			//no usamos la variable local porque es un array y podría tener mas posiciones
			cajaMensaje.val('');
		}
	
	}
	cuerpoMensajes.scrollTop(cuerpoMensajes[0].scrollHeight);
	cajaMensaje.focus();
	setTimeout(noEscribe, 0);
	timeout = setTimeout(desconectar, 600000);
	
	return false;
});


/****************SOCKETS****************/


//si inicia sesion con datos no validos y se salta la seguridad del cliente
socket.on("errLogin", function(data){
	mAviso.text(data.mensaje);
});

socket.on('update', function(usuario){ //actualiza USER LIST
	usuarios.empty();
	listaUsuarios=[];
	
	$.each(usuario,function(k,v){ //array con socket.id - nick usuario
		usuarios.append($('<li>').text(v));	
		listaUsuarios[k]=v;	
	});
	
	$.each(usuarios.children(),function(user){ 
		$(this).click(function() { 
			console.log("Deberia imprimir /w "+$(this).text());
			cajaMensaje.val("/w "+$(this).text()+": ");
		});
	});

});

socket.on('mensaje',function(jm){ // insert message ussing json
	//recibe mensaje
	$('#mensajes').append($('<li>').html(poneEmoji(jm.mensaje)));
	cajaMensaje.scrollTop = cajaMensaje.scrollHeight;
	//me puedo susurrar a mi mismo porque me siento solo
});

socket.on("escribiendo", function(data) { //pone en pantalla si escriben
	var escribiendo=data.estaEscribiendo; //boolean
	var usuario=data.usuario; //string
	if(escribiendo){
		escribe.html(usuario+' está escribiendo');
		escribe.show();
	}else{
		escribe.html("nadie está escribiendo"); //por si falla el hide
		escribe.hide();
	}
	
});
