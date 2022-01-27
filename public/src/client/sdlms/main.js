
console.log('SD LMS in use');

$('body').on('click',function(e){
    require(['sdlms'],function(sdlms){
        console.log(sdlms);
    })
})
