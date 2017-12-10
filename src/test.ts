import { StackVM, Instruction, Value, ValueType, StdActions, Parser } from "./index";

const vm = new StackVM( StdActions );

// vm.executeAll( [
//     new Instruction( 'pushi', [ new Value( ValueType.Integer, 1 ) ] ),
//     new Instruction( 'pushi', [ new Value( ValueType.Integer, 2 ) ] ),
//     new Instruction( 'add', [] ),
//     new Instruction( 'writei' ),
//     new Instruction( 'pushs', [ new Value( ValueType.String, "Hello World.\n" ) ] ),
//     new Instruction( 'writes' ),
//     new Instruction( 'pushs', [ new Value( ValueType.String, "Hello World 2.\n" ) ] ),
//     new Instruction( 'pushi', [ new Value( ValueType.Integer, 2 ) ] ),
//     new Instruction( 'pushi', [ new Value( ValueType.Integer, 2 ) ] ),
//     new Instruction( 'pushi', [ new Value( ValueType.Integer, 2 ) ] ),
//     new Instruction( 'pushl', [ new Value( ValueType.Integer, 0 ) ] ),
//     new Instruction( 'pushs', [ new Value( ValueType.String, "Goodbye World 2.\n" ) ] ),
//     new Instruction( 'storel', [ new Value( ValueType.Integer, 0 ) ] ),
//     new Instruction( 'pushl', [ new Value( ValueType.Integer, 0 ) ] ),
//     // new Instruction( 'debug' ),
//     new Instruction( 'writes' ),
//     new Instruction( 'stop' ),
// ] ).catch( error => console.error( error.message, error.stack ) );

// const instructions = new Parser().parse(`
// // exemplo de como invocar uma função by JJ
// //

// pushi 10  // a                variáveis locais
// pushi 10  // b
// pushi 10  // c
// pushi 10  // d
// pushi 10  // e
// start

// // escrever "a função devolveu", fun1(66)

//   pushi 0  // guardar um sítio em cima do qual a função vai escrever o resultado
//   pushi 66 // arg1=66

//   pusha fun1
//   call
//   nop     //nop é crucial: o return falha o calculo do endereço de retorno por 1
//   pop  1    // retira da stack os argumentos(1 parametro)

//   pushs "\n a função devolveu:"
//   writes

//   writei // escrever fun1(66);

//   pushs "\ndebug: FIM\n"
//   writes

// stop

// fun1: 
// nop // nop é crucial: o call falha por um
//   //---  fun1(arg1)=arg1 + 5 

//   pushl  -1   // get arg1
//   pushi   5 
//   add
//   storel -2  // return arg1+1

//   return
  
//   `);
const instructions = new Parser().parse(`
start

// escrever "a função devolveu", fun1(66)

  pushi 0  // guardar um sítio em cima do qual a função vai escrever o resultado
  pushi 7 // arg1=66

  pusha fib
  call
  nop     //nop é crucial: o return falha o calculo do endereço de retorno por 1
  pop  1    // retira da stack os argumentos(1 parametro)

  pushs "\n a função devolveu:"
  writes

  writei // escrever fun1(66);

  pushs "\ndebug: FIM\n"
  writes

stop

fib: 
nop
    pushl -1
    pushi 2
    inf
    jz not_zero
    pushi 1
    storel -2
    return

not_zero:
    pushi 0
    pushl -1
    pushi 1
    sub
    pusha fib
    call
    pop 1

    pushi 0
    pushl -1
    pushi 2
    sub
    pusha fib
    call
    pop 1

    add
    storel -2

    return
  `);
// const instructions = new Parser().parse(`start
// pushi 1
// pushi 2
// writei
// pushs "\n"
// writes
// pushf 3.0
// pushf 8
// fadd
// writef
// stop`);

vm.feed( instructions ).executeAll().catch( error => console.error( error.message, error.stack ) );