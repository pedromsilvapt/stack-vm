import { ValueType, Value } from "../Instruction";
import { StackVM } from "../StackVM";
import { Action } from "../Action";

export class DupAction extends Action {
    parameters : ValueType[] = [ ValueType.Integer ];

    setup ( vm : StackVM ) {
        vm.actions.set( 'dup', this );
    }

    execute ( vm : StackVM, name : string, parameters : Value[] ) {
        const amount : number = parameters[ 0 ].value;

        const pointer = vm.registers.stackPointer;

        for ( let i = 0; i < amount; i++ ) {
            vm.operands.push(
                vm.operands.load( pointer - amount + i ).clone()
            );
        }
    }
}

export class DupNAction extends Action {
    parameters : ValueType[] = [];

    setup ( vm : StackVM ) {
        vm.actions.set( 'dupn', this );
    }

    execute ( vm : StackVM, name : string, parameters : Value[] ) {
        const offset : Value<number> = vm.operands.pop();

        this.expect( offset, ValueType.Integer );

        return vm.actions.get( 'dup' ).execute( vm, name, [ offset ] );
    }
}