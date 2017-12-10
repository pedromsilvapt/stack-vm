import { ValueType, Value, TypeMismatchError } from "../Instruction";
import { StackVM } from "../StackVM";
import { Action } from "../Action";

export class ConcatAction extends Action {
    parameters : ValueType[] = [];

    setup ( vm : StackVM ) {
        vm.actions.set( 'concat', this );
    }

    execute ( vm : StackVM, name : string, parameters : Value[] ) {
        const s2 : Value<number> = vm.operands.pop();
        const s1 : Value<number> = vm.operands.pop();

        this.expect( s1, ValueType.AddressString );
        this.expect( s2, ValueType.AddressString );

        const address = vm.strings.store( '' + vm.strings.load( s1.value ) + vm.strings.load( s2.value ) );

        vm.operands.push( new Value( ValueType.AddressString, address ) );
    }
}